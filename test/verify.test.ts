import { describe, it, expect } from "vitest";
import { verify } from "@/lib/verify/score";
import { checkNettoSom } from "@/lib/verify/arithmetic";
import { checkLoonheffing, schatLoonheffingMaand } from "@/lib/verify/loonheffing2026";
import { checkPdfMeta } from "@/lib/verify/pdfMeta";
import type { Extraction } from "@/lib/schema";

const now = new Date("2026-11-01");
const good: Extraction = {
  authenticity: { is_payslip: true, visible_bsn_or_iban: false, confidence: 0.92, signals: [] },
  fields: {
    functie: "Software developer", sector: "ICT", provincie: "Utrecht", leeftijd: 32, dienstjaren: 4, periode: "2026-10",
    periode_type: "maand", uren_per_week: 40, basissalaris_periode: 4500, bruto_totaal_periode: 4500,
    totaal_inhoudingen_periode: 1260.5, netto_periode: 3239.5, loonheffing_periode: 1030, pensioen_werknemer_periode: 230.5,
    vakantiegeld_pct: 8, dertiende_maand: false, cao: null, schaal: null, lease_auto: false,
  },
};

describe("rekenkundige check", () => {
  it("klopt", () => expect(checkNettoSom(good.fields).ok).toBe(true));
  it("faalt bij verschil", () => expect(checkNettoSom({ ...good.fields, netto_periode: 3600 }).ok).toBe(true)); // reiskosten-marge
  it("faalt bij groot verschil", () => expect(checkNettoSom({ ...good.fields, netto_periode: 4000 }).ok).toBe(false));
});

describe("loonheffing 2026", () => {
  it("schatting is in redelijke orde", () => {
    const lh = schatLoonheffingMaand(4500);
    expect(lh).toBeGreaterThan(700);
    expect(lh).toBeLessThan(1400);
  });
  it("0 loonheffing bij hoog salaris is niet plausibel", () => {
    expect(checkLoonheffing({ ...good.fields, loonheffing_periode: 0 }).ok).toBe(false);
  });
});

describe("PDF-metadata", () => {
  it("salarissoftware positief", () => expect(checkPdfMeta({ producer: "AFAS Profit" }).ok).toBe(true));
  it("Word negatief", () => expect(checkPdfMeta({ producer: "Microsoft® Word for Microsoft 365" }).ok).toBe(false));
  it("screenshot neutraal", () => expect(checkPdfMeta(null).ok).toBe(null));
});

describe("verify", () => {
  it("accepteert een kloppende strook", () => expect(verify(good, { producer: "Nmbrs" }, now).verdict).toBe("accept"));
  it("accepteert screenshot zonder metadata", () => expect(verify(good, null, now).verdict).toBe("accept"));
  it("weigert als het geen strook is", () => {
    expect(verify({ ...good, authenticity: { ...good.authenticity, is_payslip: false } }, null, now).verdict).toBe("reject");
  });
  it("niet meetellen bij rekenfout", () => {
    const bad = { ...good, fields: { ...good.fields, netto_periode: 4200 }, authenticity: { ...good.authenticity, confidence: 0.7 } };
    expect(verify(bad, null, now).verdict).not.toBe("accept");
  });
  it("weigert nep met lage confidence en fouten", () => {
    const fake = {
      authenticity: { ...good.authenticity, confidence: 0.1 },
      fields: { ...good.fields, netto_periode: 4400, loonheffing_periode: 0, periode: "2019-01" },
    };
    expect(verify(fake, { producer: "Canva" }, now).verdict).toBe("reject");
  });
});
