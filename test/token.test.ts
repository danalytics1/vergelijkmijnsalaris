import { describe, it, expect, beforeAll } from "vitest";
import { signToken, verifyToken, matchesToken } from "@/lib/token";

beforeAll(() => { process.env.TOKEN_SECRET = "x".repeat(40); });

const payload = {
  verdict: "accept" as const, score: 0.9, file_hash: "abc",
  extracted: { bruto_maand: 4000, uren_per_week: 40, periode: "2026-10", leeftijd: 30, vakantiegeld_pct: 8, dertiende_maand: false, lease_auto: false },
};

describe("token", () => {
  it("round-trip", () => expect(verifyToken(signToken(payload))?.score).toBe(0.9));
  it("detecteert manipulatie", () => {
    const t = signToken(payload);
    const [body, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url").toString()), score: 1 })).toString("base64url");
    expect(verifyToken(`${forged}.${sig}`)).toBeNull();
  });
  it("verloopt", () => expect(verifyToken(signToken(payload, 0))).toBeNull());
  it("kleine afwijking ok, grote niet", () => {
    const t = verifyToken(signToken(payload))!;
    expect(matchesToken(t, { bruto_maand: 4100, uren_per_week: 40, periode: "2026-10" }).matches).toBe(true);
    expect(matchesToken(t, { bruto_maand: 5000, uren_per_week: 40, periode: "2026-10" }).deviations).toEqual(["bruto_maand"]);
  });
});
