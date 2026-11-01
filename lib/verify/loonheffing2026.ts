import type { ExtractedFields } from "../schema";
import { toMonthly } from "../normalize";
import type { Check } from "./arithmetic";

/**
 * Grove schatting van de maandelijkse loonheffing in 2026 (witte tabel, met
 * loonheffingskorting, < AOW-leeftijd). Bedoeld als plausibiliteitscheck,
 * NIET als exacte berekening. Controleer de tarieven jaarlijks.
 */
const SCHIJVEN = [
  { tot: 38_883, tarief: 0.3575 },
  { tot: 78_426, tarief: 0.3756 },
  { tot: Infinity, tarief: 0.495 },
];

function belastingJaar(jaarloon: number) {
  let rest = jaarloon, vorige = 0, totaal = 0;
  for (const s of SCHIJVEN) {
    const deel = Math.min(rest, s.tot - vorige);
    if (deel <= 0) break;
    totaal += deel * s.tarief;
    rest -= deel;
    vorige = s.tot;
  }
  return totaal;
}

function algemeneHeffingskorting(jaar: number) {
  const max = 3_115, start = 29_736, afbouw = 0.0646;
  return Math.max(0, jaar <= start ? max : max - (jaar - start) * afbouw);
}

function arbeidskorting(jaar: number) {
  // Vereenvoudigde opbouw/afbouw
  if (jaar <= 11_965) return jaar * 0.0832;
  if (jaar <= 25_845) return 996 + (jaar - 11_965) * 0.3003;
  if (jaar <= 45_592) return Math.min(5_685, 5_163 + (jaar - 25_845) * 0.0258);
  return Math.max(0, 5_685 - (jaar - 45_592) * 0.0651);
}

export function schatLoonheffingMaand(brutoFiscaalMaand: number) {
  const jaar = brutoFiscaalMaand * 12;
  const bruto = belastingJaar(jaar);
  const kortingen = algemeneHeffingskorting(jaar) + arbeidskorting(jaar);
  return Math.max(0, (bruto - kortingen) / 12);
}

export function checkLoonheffing(f: ExtractedFields): Check {
  if (f.loonheffing_periode == null || f.bruto_totaal_periode == null) {
    return { id: "loonheffing", ok: null, weight: 2, detail: "Loonheffing niet leesbaar" };
  }
  const brutoM = toMonthly(f.bruto_totaal_periode - (f.pensioen_werknemer_periode ?? 0), f.periode_type);
  const lhM = toMonthly(f.loonheffing_periode, f.periode_type);
  const verwacht = schatLoonheffingMaand(brutoM);
  // Ruime marge: geen korting toegepast, bijzondere beloningen, bijtelling, etc.
  const ondergrens = verwacht * 0.5 - 150;
  const bovengrens = brutoM * 0.52 + 50;
  const ok = lhM >= ondergrens && lhM <= bovengrens;
  return {
    id: "loonheffing",
    ok,
    weight: 2,
    detail: ok ? "Loonheffing is plausibel" : `Loonheffing €${lhM.toFixed(0)} wijkt sterk af van verwacht (~€${verwacht.toFixed(0)})`,
  };
}
