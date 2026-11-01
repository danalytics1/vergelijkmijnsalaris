import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Ondertekende "bon" van de server: legt vast wat de LLM uit de strook las.
 * Bij indienen vergelijken we het formulier met deze waarden, zodat het
 * upload-vereiste niet te omzeilen is door het formulier vrij aan te passen.
 * Bevat geen persoonsgegevens.
 */
export type AnalysisToken = {
  v: 1;
  exp: number; // epoch seconds
  verdict: "accept" | "accept_unverified";
  score: number;
  file_hash: string;
  extracted: {
    bruto_maand: number | null;
    uren_per_week: number | null;
    periode: string | null;
    leeftijd: number | null;
    vakantiegeld_pct: number | null;
    dertiende_maand: boolean | null;
    lease_auto: boolean | null;
  };
};

const TTL_SECONDS = 60 * 60;

function secret(): Buffer {
  const s = process.env.TOKEN_SECRET;
  if (!s || s.length < 32) throw new Error("TOKEN_SECRET ontbreekt of is te kort (min. 32 tekens)");
  return Buffer.from(s);
}

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");

export function signToken(payload: Omit<AnalysisToken, "v" | "exp">, now = Date.now()): string {
  const full: AnalysisToken = { v: 1, exp: Math.floor(now / 1000) + TTL_SECONDS, ...payload };
  const body = b64(JSON.stringify(full));
  const sig = b64(createHmac("sha256", secret()).update(body).digest());
  return `${body}.${sig}`;
}

export function verifyToken(token: string, now = Date.now()): AnalysisToken | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as AnalysisToken;
    if (payload.v !== 1 || payload.exp * 1000 < now) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Maximale afwijking van het bruto maandsalaris t.o.v. de strook. */
export const MAX_BRUTO_DEVIATION = 0.05;

/**
 * Bepaalt of een ingediend formulier nog overeenkomt met de strook.
 * Afwijkingen leiden niet tot weigering, maar tot `counts_in_stats = false`.
 */
export function matchesToken(
  t: AnalysisToken,
  s: { bruto_maand: number; uren_per_week: number; periode: string },
): { matches: boolean; deviations: string[] } {
  const dev: string[] = [];
  const e = t.extracted;
  if (e.bruto_maand == null || Math.abs(s.bruto_maand - e.bruto_maand) / e.bruto_maand > MAX_BRUTO_DEVIATION) dev.push("bruto_maand");
  if (e.uren_per_week == null || Math.abs(s.uren_per_week - e.uren_per_week) > 1) dev.push("uren_per_week");
  if (e.periode != null && s.periode !== e.periode) dev.push("periode");
  return { matches: dev.length === 0, deviations: dev };
}
