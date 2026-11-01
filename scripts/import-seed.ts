/**
 * Importeert een bestaande salarisdataset als startdata (source = 'seed').
 *
 *   npm run seed -- data/salarissen.csv scripts/seed-mapping.json [--dry-run]
 *
 * - Leest CSV (export uit Excel: "CSV UTF-8").
 * - Weigert het bestand als er kolommen in staan die op persoonsgegevens lijken.
 * - Normaliseert functies, leeftijd/ervaring naar banden en salaris naar fulltime.
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { PROVINCIES, SECTOREN, OPLEIDINGSNIVEAUS } from "../lib/schema";
import { functieKey, seniority, leeftijdsband, ervaringsband, fulltimeEquivalent } from "../lib/normalize";
import { findAnyPii } from "../lib/pii/detect";

type Mapping = {
  delimiter?: string;
  decimal?: "," | ".";
  columns: Record<string, string | null>;
  sectorMap?: Record<string, string>;
  defaults?: Record<string, string | number | boolean>;
};

const PII_HEADER = /(naam|name|bsn|sofi|iban|rekening|adres|address|postcode|zip|e-?mail|telefoon|phone|geboorte|birth|personeelsnummer|werkgever|employer)/i;

export function parseCsv(text: string, delimiter = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === delimiter) { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);
  return rows;
}

const ci = (list: readonly string[], v: string) => list.find((x) => x.toLowerCase() === v.trim().toLowerCase());

export function mapRow(rec: Record<string, string>, m: Mapping) {
  const get = (k: string) => {
    const col = m.columns[k];
    const v = col ? rec[col] : undefined;
    return v != null && v.trim() !== "" ? v.trim() : m.defaults?.[k] != null ? String(m.defaults[k]) : null;
  };
  const num = (k: string) => {
    const v = get(k);
    if (v == null) return null;
    const n = Number(m.decimal === "," ? v.replace(/\./g, "").replace(",", ".") : v.replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  };
  const bool = (k: string) => {
    const v = get(k)?.toLowerCase();
    return v == null ? null : ["1", "ja", "yes", "true", "j", "y", "x"].includes(v);
  };

  const errors: string[] = [];
  const functie = get("functie");
  const sectorRaw = get("sector");
  const sector = sectorRaw ? ci(SECTOREN, m.sectorMap?.[sectorRaw] ?? sectorRaw) : undefined;
  const provRaw = get("provincie");
  const provincie = provRaw ? ci(PROVINCIES, provRaw) ?? null : null;
  const leeftijd = num("leeftijd");
  const dienstjaren = num("dienstjaren") ?? 0;
  const uren = num("uren_per_week");
  const bruto = num("bruto_maand");
  const jaar = num("jaar");
  const opl = ci(OPLEIDINGSNIVEAUS, get("opleidingsniveau") ?? "onbekend") ?? "onbekend";

  if (!functie || functie.length < 2) errors.push("functie");
  if (functie && findAnyPii(functie).length) errors.push("functie bevat PII");
  if (!sector) errors.push(`sector '${sectorRaw}'`);
  if (leeftijd == null || leeftijd < 15 || leeftijd > 80) errors.push("leeftijd");
  if (uren == null || uren < 1 || uren > 60) errors.push("uren");
  if (bruto == null || bruto < 500 || bruto > 100000) errors.push("bruto_maand");
  if (jaar == null || jaar < 2015 || jaar > 2100) errors.push("jaar");
  if (errors.length) return { ok: false as const, errors };

  return {
    ok: true as const,
    row: {
      source: "seed",
      counts_in_stats: true,
      functie: functie!,
      functie_key: functieKey(functie!),
      seniority: seniority(functie!),
      sector: sector!,
      provincie,
      leeftijdsband: leeftijdsband(leeftijd!),
      ervaringsband: ervaringsband(dienstjaren),
      opleidingsniveau: opl,
      uren_per_week: uren!,
      bruto_maand: bruto!,
      bruto_maand_fte: fulltimeEquivalent(bruto!, uren!),
      vakantiegeld_pct: num("vakantiegeld_pct"),
      dertiende_maand: bool("dertiende_maand"),
      pensioen_pct: num("pensioen_pct"),
      lease_auto: bool("lease_auto"),
      cao: get("cao"),
      periode_jaar: jaar!,
    },
  };
}

async function main() {
  const [csvPath, mappingPath, ...flags] = process.argv.slice(2);
  if (!csvPath || !mappingPath) {
    console.error("Gebruik: npm run seed -- <bestand.csv> <mapping.json> [--dry-run]");
    process.exit(1);
  }
  const dry = flags.includes("--dry-run");
  const m: Mapping = JSON.parse(readFileSync(mappingPath, "utf8"));
  const text = readFileSync(csvPath, "utf8").replace(/^﻿/, "");
  const [header, ...data] = parseCsv(text, m.delimiter ?? ",");

  const piiCols = header.filter((h) => PII_HEADER.test(h));
  if (piiCols.length) {
    console.error(`Gestopt: het bestand bevat kolommen die op persoonsgegevens lijken: ${piiCols.join(", ")}. Verwijder die eerst.`);
    process.exit(2);
  }
  for (const [k, col] of Object.entries(m.columns)) {
    if (col && !header.includes(col)) console.warn(`Let op: kolom '${col}' (voor ${k}) niet gevonden`);
  }

  const rows: Extract<ReturnType<typeof mapRow>, { ok: true }>["row"][] = [];
  const errorCounts = new Map<string, number>();
  const seen = new Set<string>();
  let dupes = 0;

  for (const cells of data) {
    const rec = Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]));
    const r = mapRow(rec, m);
    if (!r.ok) { for (const e of r.errors) errorCounts.set(e, (errorCounts.get(e) ?? 0) + 1); continue; }
    const fp = createHash("sha1").update(JSON.stringify(r.row)).digest("hex");
    if (seen.has(fp)) { dupes++; continue; }
    seen.add(fp);
    rows.push(r.row);
  }

  console.log(`Gelezen: ${data.length} · Geldig: ${rows.length} · Dubbel: ${dupes} · Afgekeurd: ${data.length - rows.length - dupes}`);
  for (const [e, n] of [...errorCounts].sort((a, b) => b[1] - a[1])) console.log(`  ${n}× ongeldig: ${e}`);

  if (dry) { console.log("Dry run: niets opgeslagen. Voorbeeld:", rows.slice(0, 3)); return; }

  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ontbreken");
  const sb = createClient(url, key, { auth: { persistSession: false } });
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await sb.from("submissions").insert(rows.slice(i, i + 500));
    if (error) throw new Error(`Insert mislukt bij rij ${i}: ${error.message}`);
    console.log(`  ${Math.min(i + 500, rows.length)}/${rows.length} opgeslagen`);
  }
}

if (process.argv[1]?.endsWith("import-seed.ts")) main().catch((e) => { console.error(e.message); process.exit(1); });
