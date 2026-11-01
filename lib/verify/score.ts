import type { Extraction } from "../schema";
import { checkNettoSom, checkOrde, type Check } from "./arithmetic";
import { checkLoonheffing } from "./loonheffing2026";
import { checkMinimumloon, checkPeriode, checkKernvelden } from "./plausibility";
import { checkPdfMeta } from "./pdfMeta";

export type Verdict = "reject" | "accept" | "accept_unverified";

export type VerificationResult = {
  verdict: Verdict;
  score: number; // 0..1
  checks: Check[];
  reason?: string;
};

export const ACCEPT_THRESHOLD = 0.7;
export const REJECT_THRESHOLD = 0.4;

export function verify(
  ex: Extraction,
  pdfMeta: { producer?: string | null; creator?: string | null } | null,
  now = new Date(),
): VerificationResult {
  const a = ex.authenticity;

  if (!a.is_payslip) {
    return { verdict: "reject", score: 0, checks: [], reason: "Dit lijkt geen salarisstrook te zijn." };
  }

  const checks: Check[] = [
    checkNettoSom(ex.fields),
    checkOrde(ex.fields),
    checkLoonheffing(ex.fields),
    checkMinimumloon(ex.fields),
    checkPeriode(ex.fields, now),
    checkKernvelden(ex.fields),
    checkPdfMeta(pdfMeta),
  ];

  // Deterministische checks: alleen beslissende (ok !== null) tellen mee.
  let wSum = 0, wOk = 0;
  for (const c of checks) {
    if (c.ok === null) continue;
    wSum += c.weight;
    if (c.ok) wOk += c.weight;
  }
  const ruleScore = wSum > 0 ? wOk / wSum : 0.5;

  // Combineer met LLM-vertrouwen. Regels wegen zwaarder: die zijn niet te "overtuigen".
  const score = Math.round((0.6 * ruleScore + 0.4 * a.confidence) * 100) / 100;

  const hardFail = checks.some((c) => (c.id === "netto_som" || c.id === "orde") && c.ok === false) && a.confidence < 0.9;

  let verdict: Verdict;
  if (score < REJECT_THRESHOLD) verdict = "reject";
  else if (score >= ACCEPT_THRESHOLD && !hardFail) verdict = "accept";
  else verdict = "accept_unverified";

  return {
    verdict,
    score,
    checks,
    reason: verdict === "reject" ? "We konden niet vaststellen dat dit een echte salarisstrook is." : undefined,
  };
}
