import { describe, it, expect } from "vitest";
import { fulltimeEquivalent } from "@/lib/normalize";
import { SubmissionSchema } from "@/lib/schema";

describe("fulltimeEquivalent", () => {
  it("zonder 13e maand", () => {
    expect(fulltimeEquivalent(4000, 40)).toBe(4000);
    expect(fulltimeEquivalent(3600, 36)).toBe(4000);
  });
  it("13e maand telt mee als × 13/12", () => {
    expect(fulltimeEquivalent(4800, 40, true)).toBe(5200);
    expect(fulltimeEquivalent(3600, 36, true)).toBe(4333.33);
  });
});

describe("SubmissionSchema thuiswerkdagen", () => {
  const base = {
    functie: "Developer", sector: "ICT", provincie: "Utrecht", leeftijd: 30, dienstjaren: 5,
    opleidingsniveau: "hbo", uren_per_week: 40, bruto_maand: 4000, vakantiegeld_pct: 8,
    dertiende_maand: false, pensioen_pct: null, lease_auto: false, cao: null, periode: "2026-10",
    werkplezier: 4, senioriteit: "medior", vaardigheden: ["Python", "Analytisch", "CFA"],
  };
  it("accepteert halve dagen tussen 0 en 5", () => {
    for (const d of [0, 1.5, 2, 5]) expect(SubmissionSchema.safeParse({ ...base, thuiswerkdagen: d }).success).toBe(true);
  });
  it("weigert ongeldige waarden of ontbreken", () => {
    for (const d of [-1, 5.5, 1.3]) expect(SubmissionSchema.safeParse({ ...base, thuiswerkdagen: d }).success).toBe(false);
    expect(SubmissionSchema.safeParse(base).success).toBe(false);
  });
});

describe("SubmissionSchema werkplezier, senioriteit, vaardigheden", () => {
  const base = {
    functie: "Developer", sector: "ICT", provincie: "Utrecht", leeftijd: 30, dienstjaren: 5,
    opleidingsniveau: "hbo", uren_per_week: 40, bruto_maand: 4000, vakantiegeld_pct: 8,
    dertiende_maand: false, thuiswerkdagen: 2, pensioen_pct: null, lease_auto: false, cao: null, periode: "2026-10",
    werkplezier: 4, senioriteit: "senior", vaardigheden: ["C#", "Wft Basis", "Sociaal"],
  };
  const ok = (o: object) => SubmissionSchema.safeParse({ ...base, ...o }).success;
  it("accepteert geldige invoer", () => {
    expect(ok({})).toBe(true);
    expect(ok({ vaardigheden: ["Python"] })).toBe(true);
  });
  it("werkplezier 1-5, geheel getal", () => {
    expect(ok({ werkplezier: 0 })).toBe(false);
    expect(ok({ werkplezier: 6 })).toBe(false);
    expect(ok({ werkplezier: 3.5 })).toBe(false);
  });
  it("senioriteit uit vaste lijst", () => {
    expect(ok({ senioriteit: "lead" })).toBe(true);
    expect(ok({ senioriteit: "stagiair" })).toBe(false);
  });
  it("vaardigheden: 1-3, uit de lijst, uniek", () => {
    expect(ok({ vaardigheden: [] })).toBe(false);
    expect(ok({ vaardigheden: ["Python", "SQL", "R", "Go"] })).toBe(false);
    expect(ok({ vaardigheden: ["Mijn naam is Jan"] })).toBe(false);
    expect(ok({ vaardigheden: ["Python", "Python"] })).toBe(false);
  });
});
