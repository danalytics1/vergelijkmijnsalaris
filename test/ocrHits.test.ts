import { describe, it, expect } from "vitest";
import { findBsnIban } from "@/lib/pii/detect";
import { coveredFraction, findHitsInOcr, type OcrPage } from "@/lib/pii/ocrHits";

const w = (text: string, x: number, y = 0, width = 40) => ({ text, box: { x, y, w: width, h: 10 } });
const line = (words: ReturnType<typeof w>[]) => ({
  box: { x: 0, y: words[0].box.y, w: 500, h: 10 },
  words,
});

// 111222333 haalt de 11-proef; NL91ABNA0417164300 is een geldige test-IBAN.
const page: OcrPage = {
  lines: [
    line([w("Sofinummer:", 0), w("111", 100), w("222", 150), w("333", 200)]),
    line([w("IBAN", 0, 20), w("NL91ABNA0417164300", 100, 20, 180)]),
    line([w("Brutoloon", 0, 40), w("3.250,00", 100, 40)]),
  ],
};
const detect = (t: string) => findBsnIban(t);

describe("coveredFraction", () => {
  it("telt overlappende balken niet dubbel", () => {
    const box = { x: 0, y: 0, w: 10, h: 10 };
    expect(coveredFraction(box, [{ x: 0, y: 0, w: 10, h: 10 }, { x: 0, y: 0, w: 10, h: 10 }])).toBe(1);
    expect(coveredFraction(box, [{ x: 0, y: 0, w: 5, h: 10 }, { x: 3, y: 0, w: 4, h: 10 }])).toBeCloseTo(0.7);
    expect(coveredFraction(box, [])).toBe(0);
  });
});

describe("findHitsInOcr", () => {
  it("vindt BSN en IBAN zonder balken", () => {
    const hits = findHitsInOcr(page, [], detect);
    expect(hits.map((h) => h.type).sort()).toEqual(["bsn", "iban"]);
    const bsn = hits.find((h) => h.type === "bsn")!;
    expect(bsn.box.x).toBe(100);
    expect(bsn.box.w).toBe(140);
  });

  it("is leeg als beide nummers volledig zijn afgeschermd", () => {
    const masks = [{ x: 95, y: -2, w: 150, h: 14 }, { x: 95, y: 18, w: 190, h: 14 }];
    expect(findHitsInOcr(page, masks, detect)).toEqual([]);
  });

  it("blijft melden bij een balk die maar half over het nummer ligt", () => {
    const masks = [{ x: 95, y: -2, w: 70, h: 14 }, { x: 95, y: 18, w: 190, h: 14 }];
    // "111" afgedekt, "222 333" niet: geen geldig BSN meer, dus geen melding.
    expect(findHitsInOcr(page, masks, detect)).toEqual([]);
    const ibanHalf = [{ x: 95, y: -2, w: 150, h: 14 }, { x: 95, y: 18, w: 60, h: 14 }];
    expect(findHitsInOcr(page, ibanHalf, detect).map((h) => h.type)).toEqual(["iban"]);
  });

  it("plakt cijfers rond een afgeschermd woord niet aan elkaar", () => {
    const p: OcrPage = { lines: [line([w("1112", 0), w("XXXX", 50), w("2233", 100), w("3", 150)])] };
    expect(findHitsInOcr(p, [{ x: 50, y: 0, w: 40, h: 10 }], detect)).toEqual([]);
  });
});
