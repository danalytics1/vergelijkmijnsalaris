import { describe, it, expect } from "vitest";
import { isValidBsn, isValidIban, findBsnIban, findAnyPii } from "@/lib/pii/detect";
import { scrubExtraction } from "@/lib/pii/scrub";
import type { Extraction } from "@/lib/schema";

// 111222333 en 123456782 zijn bekende test-BSN's die de 11-proef halen.
describe("BSN 11-proef", () => {
  it("accepteert geldige BSN's", () => {
    expect(isValidBsn("111222333")).toBe(true);
    expect(isValidBsn("123456782")).toBe(true);
    expect(isValidBsn("1234.56.782")).toBe(true);
  });
  it("weigert ongeldige", () => {
    expect(isValidBsn("123456789")).toBe(false);
    expect(isValidBsn("000000000")).toBe(false);
    expect(isValidBsn("12345")).toBe(false);
  });
});

describe("IBAN mod-97", () => {
  it("valideert", () => {
    expect(isValidIban("NL91ABNA0417164300")).toBe(true);
    expect(isValidIban("NL91 ABNA 0417 1643 00")).toBe(true);
    expect(isValidIban("NL92ABNA0417164300")).toBe(false);
  });
});

describe("findBsnIban (OCR-tekst)", () => {
  it("vindt BSN in strooktekst", () => {
    expect(findBsnIban("Sofinummer: 111 222 333  Periode 10").map((h) => h.type)).toEqual(["bsn"]);
  });
  it("vindt BSN met OCR-fouten (O i.p.v. 0)", () => {
    expect(findBsnIban("BSN 12345678Z 1234567B2").length).toBeGreaterThanOrEqual(1);
  });
  it("vindt IBAN met spaties", () => {
    expect(findBsnIban("Uitbetaald op NL91 ABNA 0417 1643 00").map((h) => h.type)).toEqual(["iban"]);
  });
  it("meldt NL-IBAN-patroon ook als checksum door OCR stuk is (niet-strict)", () => {
    expect(findBsnIban("NL92ABNA0417164300").length).toBe(1);
    expect(findBsnIban("NL92ABNA0417164300", { strict: true }).length).toBe(0);
  });
  it("negeert bedragen en datums", () => {
    expect(findBsnIban("Bruto 4.250,00 Netto 3.012,45 Datum 25-10-2026 Uren 173,33")).toEqual([]);
  });
  it("niets na afscherming", () => {
    expect(findBsnIban("BSN ███████ IBAN ███████████")).toEqual([]);
  });
});

describe("findAnyPii", () => {
  it("vindt e-mail, postcode, telefoon", () => {
    const types = findAnyPii("jan@example.nl 1234 AB 06-12345678").map((h) => h.type).sort();
    expect(types).toEqual(["email", "postcode", "telefoon"]);
  });
});

const base: Extraction = {
  authenticity: { is_payslip: true, visible_bsn_or_iban: false, confidence: 0.9, signals: ["loonheffingstabel aanwezig"] },
  fields: {
    functie: "Software developer", sector: "ICT", provincie: "Utrecht", leeftijd: 32, dienstjaren: 4, periode: "2026-10",
    periode_type: "maand", uren_per_week: 40, basissalaris_periode: 4500, bruto_totaal_periode: 4500,
    totaal_inhoudingen_periode: 1300, netto_periode: 3200, loonheffing_periode: 1100, pensioen_werknemer_periode: 200,
    vakantiegeld_pct: 8, dertiende_maand: false, cao: null, schaal: null, lease_auto: false,
  },
};

describe("scrubExtraction", () => {
  it("laat schone output door", () => {
    expect(scrubExtraction(base).ok).toBe(true);
  });
  it("weigert als BSN in een veld lekt", () => {
    const r = scrubExtraction({ ...base, fields: { ...base.fields, functie: "Developer 111222333" } });
    expect(r.ok).toBe(false);
  });
  it("weigert als IBAN in signals lekt", () => {
    const r = scrubExtraction({ ...base, authenticity: { ...base.authenticity, signals: ["IBAN NL91ABNA0417164300 zichtbaar"] } });
    expect(r.ok).toBe(false);
  });
  it("verwijdert e-mail uit signals", () => {
    const r = scrubExtraction({ ...base, authenticity: { ...base.authenticity, signals: ["contact hr@bedrijf.nl", "ok"] } });
    expect(r.ok && r.extraction.authenticity.signals).toEqual(["ok"]);
  });
});

describe("label-gebaseerde detectie (OCR mist een cijfer)", () => {
  it("BSN met 8 cijfers na label", () => {
    expect(findBsnIban("BSN 11222333 Periode 2026-10").map((h) => h.type)).toContain("bsn");
    expect(findBsnIban("Sofinummer: 1122 23 33").map((h) => h.type)).toContain("bsn");
  });
  it("IBAN na label, ook met kapotte checksum", () => {
    expect(findBsnIban("Rekeningnummer NL9 1ABNA0417164300".replace("NL9 1", "NL91 ")).map((h) => h.type)).toContain("iban");
  });
  it("afgeschermd label geeft geen hit", () => {
    expect(findBsnIban("BSN ████████ Periode 2026-10 (maand)")).toEqual([]);
    expect(findBsnIban("BSN | Periode 2026-10")).toEqual([]);
    expect(findBsnIban("Uitbetaald op rekening —— Reservering vakantiegeld 8% 360,00")).toEqual([]);
  });
});
