import type { Check } from "./arithmetic";

const PAYROLL_SOFTWARE = [
  "afas", "nmbrs", "loket", "visma", "raet", "youforce", "exact", "adp", "sdworx", "sd worx",
  "workday", "sap", "employes", "personio", "hr2day", "payroll", "salaris", "ultimo", "cezanne", "nedap",
];
const SUSPICIOUS = ["microsoft word", "word for", "msword", "canva", "google docs", "libreoffice writer", "pages", "photoshop", "illustrator", "inkscape", "gimp"];

/**
 * Metadata wordt in de browser uitgelezen (de PDF zelf verlaat het apparaat
 * niet) en alleen als producer/creator-string meegestuurd.
 */
export function checkPdfMeta(meta: { producer?: string | null; creator?: string | null } | null): Check {
  if (!meta || (!meta.producer && !meta.creator)) {
    return { id: "pdf_meta", ok: null, weight: 1, detail: "Geen PDF-metadata (screenshot of opgeschoond bestand)" };
  }
  const s = `${meta.producer ?? ""} ${meta.creator ?? ""}`.toLowerCase().replace(/[^a-z0-9 ]+/g, "").replace(/\s+/g, " ");
  if (PAYROLL_SOFTWARE.some((p) => s.includes(p))) return { id: "pdf_meta", ok: true, weight: 1, detail: "Gemaakt met salarissoftware" };
  if (SUSPICIOUS.some((p) => s.includes(p))) return { id: "pdf_meta", ok: false, weight: 2, detail: "Gemaakt met tekst- of ontwerpsoftware" };
  return { id: "pdf_meta", ok: null, weight: 1, detail: "Onbekende PDF-producer" };
}
