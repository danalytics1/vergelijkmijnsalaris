import { describe, it, expect } from "vitest";
import { parseCsv, mapRow, bedrijfsgrootteBand } from "@/scripts/import-seed";

const mapping = {
  delimiter: ";", decimal: "," as const,
  columns: { functie: "Functie", sector: "Sector", provincie: "Provincie", leeftijd: "Leeftijd", dienstjaren: "Ervaring", uren_per_week: "Uren", bruto_maand: "Bruto", jaar: "Jaar", dertiende_maand: "13e" },
  sectorMap: { IT: "ICT" },
  defaults: { vakantiegeld_pct: 8 },
};

describe("seed import", () => {
  it("parset CSV met quotes", () => {
    expect(parseCsv('a;b\n"x;y";"he said ""hi"""\n', ";")).toEqual([["a", "b"], ["x;y", 'he said "hi"']]);
  });
  it("mapt een rij", () => {
    const r = mapRow({ Functie: "Senior Developer", Sector: "IT", Provincie: "utrecht", Leeftijd: "35", Ervaring: "7", Uren: "36", Bruto: "5.400,00", Jaar: "2026", "13e": "ja" }, mapping);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.row.sector).toBe("ICT");
      expect(r.row.provincie).toBe("Utrecht");
      expect(r.row.bruto_maand).toBe(5400);
      expect(r.row.bruto_maand_fte).toBe(6500); // 5400/36*40 × 13/12 (13e maand)
      expect(r.row.seniority).toBe("senior");
      expect(r.row.dertiende_maand).toBe(true);
    }
  });
  it("keurt ongeldige rijen af", () => {
    const r = mapRow({ Functie: "x", Sector: "Onbekend", Leeftijd: "200", Uren: "40", Bruto: "10", Jaar: "2026" }, mapping);
    expect(r.ok).toBe(false);
  });
  it("zet bedrijfsgrootte om naar een band", () => {
    expect(bedrijfsgrootteBand("50-249")).toBe("50-249");
    expect(bedrijfsgrootteBand("50 – 249")).toBe("50-249");
    expect(bedrijfsgrootteBand("1000+")).toBe("1000+");
    expect(bedrijfsgrootteBand("9")).toBe("1-9");
    expect(bedrijfsgrootteBand("10")).toBe("10-49");
    expect(bedrijfsgrootteBand("249")).toBe("50-249");
    expect(bedrijfsgrootteBand("1000")).toBe("1000+");
    expect(bedrijfsgrootteBand("onbekend")).toBeNull();
    expect(bedrijfsgrootteBand("groot")).toBeUndefined();
    expect(bedrijfsgrootteBand("0")).toBeUndefined();
  });
  it("keurt een rij met ongeldige bedrijfsgrootte af", () => {
    const m = { ...mapping, columns: { ...mapping.columns, bedrijfsgrootte: "Grootte" } };
    const r = mapRow({ Functie: "Developer", Sector: "IT", Provincie: "utrecht", Leeftijd: "35", Ervaring: "7", Uren: "40", Bruto: "5000", Jaar: "2026", Grootte: "groot" }, m);
    expect(r.ok).toBe(false);
    const ok = mapRow({ Functie: "Developer", Sector: "IT", Provincie: "utrecht", Leeftijd: "35", Ervaring: "7", Uren: "40", Bruto: "5000", Jaar: "2026", Grootte: "120" }, m);
    expect(ok.ok && ok.row.bedrijfsgrootte).toBe("50-249");
  });
});
