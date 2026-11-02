/**
 * Puur (zonder DOM) deel van de BSN/IBAN-controle: bepaalt op basis van één
 * OCR-resultaat van de originele afbeelding welke nummers nog zichtbaar zijn
 * gegeven de getekende zwarte balken. Zo hoeft OCR niet opnieuw te draaien
 * na elke wijziging van de balken.
 */
import type { PiiHit } from "./detect";

export type Box = { x: number; y: number; w: number; h: number };
/** box.w === 0: wel gevonden in de tekst, maar niet terug te vinden op de afbeelding. */
export type GateHit = { type: "bsn" | "iban"; box: Box; match: string };
export type OcrWord = { text: string; box: Box };
export type OcrLine = { box: Box; words: OcrWord[] };
export type OcrPage = { lines: OcrLine[] };

/** Een woord geldt als afgeschermd als minstens dit deel van het woordvak zwart is. */
export const COVERED_THRESHOLD = 0.8;

/** Plaatshouder voor een afgeschermd woord: voorkomt dat cijfers links en rechts ervan aan elkaar plakken. */
const HIDDEN = "█";

function intersect(a: Box, b: Box): Box | null {
  const x0 = Math.max(a.x, b.x), y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w), y1 = Math.min(a.y + a.h, b.y + b.h);
  return x1 > x0 && y1 > y0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
}

/** Deel van `box` dat onder de balken valt (overlappende balken niet dubbel geteld). */
export function coveredFraction(box: Box, masks: Box[]): number {
  const area = box.w * box.h;
  if (area <= 0) return 1;
  const parts = masks.map((m) => intersect(box, m)).filter((p): p is Box => p !== null);
  if (!parts.length) return 0;
  // Exacte vereniging via rasterisatie op de randen van de overlappende vakken.
  const xs = [...new Set(parts.flatMap((p) => [p.x, p.x + p.w]))].sort((a, b) => a - b);
  const ys = [...new Set(parts.flatMap((p) => [p.y, p.y + p.h]))].sort((a, b) => a - b);
  let covered = 0;
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < ys.length - 1; j++) {
      const cx = (xs[i] + xs[i + 1]) / 2, cy = (ys[j] + ys[j + 1]) / 2;
      if (parts.some((p) => cx >= p.x && cx <= p.x + p.w && cy >= p.y && cy <= p.y + p.h)) {
        covered += (xs[i + 1] - xs[i]) * (ys[j + 1] - ys[j]);
      }
    }
  }
  return covered / area;
}

function union(boxes: Box[]): Box {
  const x0 = Math.min(...boxes.map((b) => b.x)), y0 = Math.min(...boxes.map((b) => b.y));
  const x1 = Math.max(...boxes.map((b) => b.x + b.w)), y1 = Math.max(...boxes.map((b) => b.y + b.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function findHitsInOcr(page: OcrPage, masks: Box[], detect: (text: string) => PiiHit[]): GateHit[] {
  const lines = page.lines.map((l) => {
    const words = l.words.map((w) => ({ ...w, hidden: coveredFraction(w.box, masks) >= COVERED_THRESHOLD }));
    return { box: l.box, words, text: words.map((w) => (w.hidden ? HIDDEN : w.text)).join(" ") };
  });
  const hits: GateHit[] = [];

  for (const line of lines) {
    const visible = line.words.filter((w) => !w.hidden);
    for (const h of detect(line.text)) {
      if (h.type !== "bsn" && h.type !== "iban") continue;
      // Probeer de woorden te vinden die de match vormen; anders de hele regel.
      const parts = h.match.split(/\s+/).filter(Boolean);
      const words = visible.filter((w) => parts.some((p) => w.text.includes(p) || p.includes(w.text.replace(/[^\w]/g, "")) && w.text.length > 1));
      hits.push({ type: h.type, box: union(words.length ? words.map((w) => w.box) : [line.box]), match: h.match });
    }
  }

  // Vangnet: ook op de volledige tekst, voor labels die op een eigen regel staan
  // ("BSN" ⏎ "123456789"). Regeleinden blijven staan, anders plakt de regex
  // cijfers uit verschillende regels/kolommen aan elkaar tot een nep-BSN.
  if (hits.length === 0) {
    const allVisible = lines.flatMap((l) => l.words.filter((w) => !w.hidden));
    for (const h of detect(lines.map((l) => l.text).join("\n"))) {
      if (h.type !== "bsn" && h.type !== "iban") continue;
      const digits = h.match.replace(/[^\dA-Za-z]/g, "");
      const words = allVisible.filter((w) => {
        const t = w.text.replace(/[^\dA-Za-z]/g, "");
        return t.length >= 2 && /\d/.test(t) && digits.includes(t);
      });
      hits.push({ type: h.type, box: words.length ? union(words.map((w) => w.box)) : { x: 0, y: 0, w: 0, h: 0 }, match: h.match.trim() });
    }
  }
  return hits;
}
