"use client";

import { findBsnIban } from "../pii/detect";

export type Box = { x: number; y: number; w: number; h: number };
export type GateHit = { type: "bsn" | "iban"; box: Box };

type TWorker = { recognize: (img: HTMLCanvasElement, o?: object, out?: object) => Promise<{ data: TData }>; terminate: () => Promise<unknown> };
type TBbox = { x0: number; y0: number; x1: number; y1: number };
type TLine = { text: string; bbox: TBbox; words: { text: string; bbox: TBbox }[] };
type TData = { text: string; blocks?: { paragraphs: { lines: TLine[] }[] }[] | null };

let workerPromise: Promise<TWorker> | null = null;

/** Tesseract draait lokaal (WASM). Assets komen uit /public/vendor, niet van een CDN. */
function getWorker(): Promise<TWorker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      const origin = window.location.origin;
      return (await createWorker("nld", 1, {
        workerPath: `${origin}/vendor/tesseract/worker.min.js`,
        corePath: `${origin}/vendor/tesseract`,
        langPath: `${origin}/vendor/tesseract/lang`,
        gzip: true,
      })) as unknown as TWorker;
    })();
  }
  return workerPromise;
}

/**
 * Zoekt leesbare BSN's en IBAN's op een (al deels afgeschermd) canvas.
 * Leeg resultaat = upload toegestaan.
 */
/** Vergroot kleine afbeeldingen (screenshots) en zet om naar grijs: OCR mist anders cijfers. */
function prepareForOcr(src: HTMLCanvasElement): { canvas: HTMLCanvasElement; scale: number } {
  const scale = Math.min(3, Math.max(1, 2400 / src.width));
  const c = document.createElement("canvas");
  c.width = Math.round(src.width * scale);
  c.height = Math.round(src.height * scale);
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.filter = "grayscale(1) contrast(1.4)";
  ctx.drawImage(src, 0, 0, c.width, c.height);
  return { canvas: c, scale };
}

export async function scanForBsnIban(source: HTMLCanvasElement): Promise<GateHit[]> {
  const worker = await getWorker();
  const { canvas, scale } = prepareForOcr(source);
  const { data } = await worker.recognize(canvas, {}, { blocks: true, text: true });
  const hits: GateHit[] = [];
  const toBox = (b: TBbox): Box => ({ x: b.x0 / scale, y: b.y0 / scale, w: (b.x1 - b.x0) / scale, h: (b.y1 - b.y0) / scale });

  const lines: TLine[] = (data.blocks ?? []).flatMap((b) => b.paragraphs.flatMap((p) => p.lines));
  for (const line of lines) {
    for (const h of findBsnIban(line.text)) {
      // Probeer de woorden te vinden die de match vormen; anders de hele regel.
      const parts = h.match.split(/\s+/).filter(Boolean);
      const words = line.words.filter((w) => parts.some((p) => w.text.includes(p) || p.includes(w.text.replace(/[^\w]/g, "")) && w.text.length > 1));
      const boxes = words.length ? words.map((w) => toBox(w.bbox)) : [toBox(line.bbox)];
      const x0 = Math.min(...boxes.map((b) => b.x)), y0 = Math.min(...boxes.map((b) => b.y));
      const x1 = Math.max(...boxes.map((b) => b.x + b.w)), y1 = Math.max(...boxes.map((b) => b.y + b.h));
      hits.push({ type: h.type as "bsn" | "iban", box: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } });
    }
  }

  // Vangnet: ook op de volledige tekst (regels kunnen verkeerd gesplitst zijn).
  if (hits.length === 0) {
    const flat = findBsnIban(data.text.replace(/\n/g, " "));
    for (const h of flat) hits.push({ type: h.type as "bsn" | "iban", box: { x: 0, y: 0, w: 0, h: 0 } });
  }
  return hits;
}
