import type { ExtractedFields } from "../schema";
import { toMonthly } from "../normalize";
import type { Check } from "./arithmetic";

/** Wettelijk minimumuurloon 2026 (21+), afgerond. Jaarlijks bijwerken. */
export const MINIMUM_UURLOON_2026 = 14.4;

export function checkMinimumloon(f: ExtractedFields): Check {
  if (f.basissalaris_periode == null || f.uren_per_week == null) {
    return { id: "minimumloon", ok: null, weight: 1, detail: "Uren of basissalaris onbekend" };
  }
  const maand = toMonthly(f.basissalaris_periode, f.periode_type);
  const uur = (maand * 12) / 52 / f.uren_per_week;
  const jong = f.leeftijd != null && f.leeftijd < 21;
  const ok = jong ? uur >= 5 : uur >= MINIMUM_UURLOON_2026 * 0.97;
  return { id: "minimumloon", ok, weight: 1, detail: ok ? "Boven wettelijk minimum" : `Uurloon €${uur.toFixed(2)} ligt onder het minimumloon` };
}

export function checkPeriode(f: ExtractedFields, now = new Date()): Check {
  if (!f.periode) return { id: "periode", ok: null, weight: 1, detail: "Periode niet leesbaar" };
  const [y, m] = f.periode.split("-").map(Number);
  const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
  const ok = months >= -1 && months <= 18;
  return { id: "periode", ok, weight: 1, detail: ok ? "Recente strook" : "Strook is ouder dan 18 maanden of ligt in de toekomst" };
}

export function checkKernvelden(f: ExtractedFields): Check {
  const missing = (["functie", "basissalaris_periode", "uren_per_week", "periode"] as const).filter((k) => f[k] == null);
  return {
    id: "kernvelden",
    ok: missing.length === 0 ? true : missing.length >= 3 ? false : null,
    weight: 1,
    detail: missing.length ? `Niet gevonden: ${missing.join(", ")}` : "Alle kernvelden gevonden",
  };
}
