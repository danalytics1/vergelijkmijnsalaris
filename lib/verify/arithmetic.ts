import type { ExtractedFields } from "../schema";

export type Check = { id: string; ok: boolean | null; weight: number; detail: string };

/** bruto − inhoudingen ≈ netto (marge €2, ivm afronding en netto-vergoedingen). */
export function checkNettoSom(f: ExtractedFields): Check {
  const { bruto_totaal_periode: b, totaal_inhoudingen_periode: i, netto_periode: n } = f;
  if (b == null || i == null || n == null) {
    return { id: "netto_som", ok: null, weight: 3, detail: "Bruto, inhoudingen of netto niet leesbaar" };
  }
  const diff = Math.abs(b - i - n);
  // Netto-vergoedingen (reiskosten) kunnen netto verhogen; tot €400 tolereren als netto hoger is.
  const ok = diff <= 2 || (n > b - i && n - (b - i) <= 400);
  return { id: "netto_som", ok, weight: 3, detail: ok ? "Bruto − inhoudingen klopt met netto" : `Verschil van €${diff.toFixed(2)} tussen bruto − inhoudingen en netto` };
}

/** Netto moet lager zijn dan bruto, basis lager dan of gelijk aan totaal bruto. */
export function checkOrde(f: ExtractedFields): Check {
  const { basissalaris_periode: base, bruto_totaal_periode: b, netto_periode: n } = f;
  if (b == null || n == null) return { id: "orde", ok: null, weight: 2, detail: "Onvoldoende bedragen" };
  const ok = n < b && (base == null || base <= b + 1);
  return { id: "orde", ok, weight: 2, detail: ok ? "Verhouding bruto/netto is logisch" : "Netto ≥ bruto of basis > totaal bruto" };
}
