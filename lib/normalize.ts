import type { ExtractedFields } from "./schema";

/** Rekent een periodebedrag om naar een maandbedrag. */
export function toMonthly(amount: number, type: "maand" | "4weken" | "week" | null): number {
  if (type === "4weken") return (amount * 13) / 12;
  if (type === "week") return (amount * 52) / 12;
  return amount;
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function brutoMaand(f: ExtractedFields): number | null {
  const base = f.basissalaris_periode ?? null;
  if (base == null) return null;
  return round2(toMonthly(base, f.periode_type));
}

/** Bruto uurloon o.b.v. maandsalaris en contracturen. */
export function uurloon(bruto_maand: number, uren_per_week: number) {
  return round2((bruto_maand * 12) / 52 / uren_per_week);
}

/** Herleidt naar fulltime (40u) maandsalaris voor eerlijke vergelijking. */
export function fulltimeEquivalent(bruto_maand: number, uren_per_week: number, fulltime = 40) {
  return round2((bruto_maand / uren_per_week) * fulltime);
}

export function leeftijdsband(leeftijd: number): string {
  if (leeftijd < 25) return "<25";
  if (leeftijd < 35) return "25-34";
  if (leeftijd < 45) return "35-44";
  if (leeftijd < 55) return "45-54";
  return "55+";
}

export function ervaringsband(jaren: number): string {
  if (jaren < 2) return "0-2";
  if (jaren < 5) return "2-5";
  if (jaren < 10) return "5-10";
  return "10+";
}

/** Normaliseert een functietitel tot een vergelijkbare sleutel. */
export function functieKey(functie: string): string {
  return functie
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\b(sr|senior|jr|junior|medior|m\/v|v\/m|m\/v\/x)\b\.?/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function seniority(functie: string): "junior" | "medior" | "senior" | null {
  const f = functie.toLowerCase();
  if (/\b(sr|senior|lead|principal)\b/.test(f)) return "senior";
  if (/\b(jr|junior|trainee|starter)\b/.test(f)) return "junior";
  if (/\bmedior\b/.test(f)) return "medior";
  return null;
}
