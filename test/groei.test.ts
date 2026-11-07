import { describe, it, expect } from "vitest";
import { sorteerPunten, asNiveaus, volgendeStap, yDomein } from "@/lib/groei";

const rij = (seniority: string, p50: number) => ({ seniority, n: "12", p25: String(p50 - 400), p50: String(p50), p75: String(p50 + 400) });

describe("salarisgroei per senioriteit", () => {
  const punten = sorteerPunten([rij("senior", 5000), rij("junior", 3000), rij("onzin", 1), rij("lead", 6000)]);

  it("sorteert van junior naar manager en negeert onbekende niveaus", () => {
    expect(punten.map((p) => p.seniority)).toEqual(["junior", "senior", "lead"]);
    expect(punten[0].p50).toBe(3000);
  });
  it("houdt tussenliggende niveaus zonder data op de as en neemt het eigen niveau mee", () => {
    expect(asNiveaus(punten, null)).toEqual(["junior", "medior", "senior", "lead"]);
    expect(asNiveaus(punten, "manager")).toEqual(["junior", "medior", "senior", "lead", "manager"]);
  });
  it("vindt het eerstvolgende hogere niveau met data", () => {
    expect(volgendeStap(punten, "medior")?.seniority).toBe("senior");
    expect(volgendeStap(punten, "lead")).toBeNull();
    expect(volgendeStap(punten, null)).toBeNull();
  });
  it("omvat data en eigen salaris in het y-domein", () => {
    const { min, max, ticks } = yDomein(punten, 8000);
    expect(min).toBeLessThanOrEqual(2600);
    expect(max).toBeGreaterThanOrEqual(8000);
    expect(ticks[0]).toBe(min);
    expect(ticks.at(-1)).toBe(max);
    expect(ticks.length).toBeLessThanOrEqual(6);
    expect(ticks.every((t) => t % 250 === 0)).toBe(true);
  });
});
