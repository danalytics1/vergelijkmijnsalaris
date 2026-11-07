import { SENIORITEITEN } from "./schema";

export type Senioriteit = (typeof SENIORITEITEN)[number];
export type GroeiPunt = { seniority: Senioriteit; n: number; p25: number; p50: number; p75: number };

export const SENIORITEIT_LABELS: Record<Senioriteit, string> = {
  junior: "Junior", medior: "Medior", senior: "Senior", lead: "Lead", manager: "Manager",
};

const isSenioriteit = (s: unknown): s is Senioriteit => (SENIORITEITEN as readonly unknown[]).includes(s);

/** Ruwe RPC-rijen → geldige punten, gesorteerd van junior naar manager. */
export function sorteerPunten(rijen: { seniority: unknown; n: unknown; p25: unknown; p50: unknown; p75: unknown }[]): GroeiPunt[] {
  return rijen
    .filter((r) => isSenioriteit(r.seniority))
    .map((r) => ({ seniority: r.seniority as Senioriteit, n: Number(r.n), p25: Number(r.p25), p50: Number(r.p50), p75: Number(r.p75) }))
    .sort((a, b) => SENIORITEITEN.indexOf(a.seniority) - SENIORITEITEN.indexOf(b.seniority));
}

/**
 * Niveaus op de x-as: van het laagste tot het hoogste niveau met data, plus het eigen niveau.
 * Tussenliggende niveaus zonder data blijven staan (zonder punt), zodat de as eerlijk is.
 */
export function asNiveaus(punten: GroeiPunt[], eigen: Senioriteit | null): Senioriteit[] {
  const idx = punten.map((p) => SENIORITEITEN.indexOf(p.seniority));
  if (eigen) idx.push(SENIORITEITEN.indexOf(eigen));
  if (idx.length === 0) return [];
  return SENIORITEITEN.slice(Math.min(...idx), Math.max(...idx) + 1);
}

/** Eerstvolgende hoger niveau met data, of null. */
export function volgendeStap(punten: GroeiPunt[], eigen: Senioriteit | null): GroeiPunt | null {
  if (!eigen) return null;
  const i = SENIORITEITEN.indexOf(eigen);
  return punten.find((p) => SENIORITEITEN.indexOf(p.seniority) > i) ?? null;
}

/** Y-domein en ticks op ronde stappen (€250/500/1000/2000), met wat lucht rond de data en het eigen salaris. */
export function yDomein(punten: GroeiPunt[], waarde: number): { min: number; max: number; ticks: number[] } {
  const lo = Math.min(waarde, ...punten.map((p) => p.p25));
  const hi = Math.max(waarde, ...punten.map((p) => p.p75));
  const marge = Math.max(250, (hi - lo) * 0.1);
  const stap = [250, 500, 1000, 2000, 5000].find((st) => (hi - lo + 2 * marge) / st <= 5) ?? 10000;
  const min = Math.max(0, Math.floor((lo - marge) / stap) * stap);
  const max = Math.ceil((hi + marge) / stap) * stap;
  const ticks: number[] = [];
  for (let t = min; t <= max; t += stap) ticks.push(t);
  return { min, max, ticks };
}
