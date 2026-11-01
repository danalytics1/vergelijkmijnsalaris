import { findAnyPii } from "./detect";
import type { Extraction } from "../schema";

/**
 * Laatste vangnet op de server: controleert alle vrije-tekstvelden in de
 * LLM-output op PII. Bij een BSN/IBAN-hit wordt de hele analyse afgekeurd;
 * overige hits worden uit het veld verwijderd.
 */
export function scrubExtraction(ex: Extraction): { ok: true; extraction: Extraction } | { ok: false; reason: "pii_in_output" } {
  const f = { ...ex.fields };
  const textFields = ["functie", "cao", "schaal"] as const;

  for (const key of textFields) {
    const v = f[key];
    if (typeof v !== "string") continue;
    const hits = findAnyPii(v);
    if (hits.some((h) => h.type === "bsn" || h.type === "iban")) return { ok: false, reason: "pii_in_output" };
    if (hits.length) f[key] = null;
  }

  const signals = ex.authenticity.signals.filter((s) => {
    const hits = findAnyPii(s);
    return hits.length === 0;
  });
  if (signals.length !== ex.authenticity.signals.length && findAnyPii(ex.authenticity.signals.join(" ")).some((h) => h.type === "bsn" || h.type === "iban")) {
    return { ok: false, reason: "pii_in_output" };
  }

  return { ok: true, extraction: { authenticity: { ...ex.authenticity, signals }, fields: f } };
}
