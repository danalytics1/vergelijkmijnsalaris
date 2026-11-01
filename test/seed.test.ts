import { describe, it, expect } from "vitest";
import { parseCsv, mapRow } from "@/scripts/import-seed";

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
      expect(r.row.bruto_maand_fte).toBe(6000);
      expect(r.row.seniority).toBe("senior");
      expect(r.row.dertiende_maand).toBe(true);
    }
  });
  it("gebruikt expliciete senioriteit boven afleiding uit de titel", () => {
    const m = { ...mapping, columns: { ...mapping.columns, seniority: "Sen" } };
    const r = mapRow({ Functie: "Developer", Sector: "IT", Leeftijd: "30", Uren: "40", Bruto: "4000", Jaar: "2026", Sen: "Medior" }, m);
    expect(r.ok && r.row.seniority).toBe("medior");
  });
  it("keurt ongeldige rijen af", () => {
    const r = mapRow({ Functie: "x", Sector: "Onbekend", Leeftijd: "200", Uren: "40", Bruto: "10", Jaar: "2026" }, mapping);
    expect(r.ok).toBe(false);
  });
});
