"use client";

import { findBsnIban } from "../pii/detect";
import { findHitsInOcr, type Box, type GateHit, type OcrPage, type OcrWord } from "../pii/ocrHits";

export type { Box, GateHit } from "../pii/ocrHits";

type TLoggerMsg = { status: string; progress: number; jobId?: string };
type TWorker = { recognize: (img: HTMLCanvasElement, o?: object, out?: object) => Promise<{ data: TData }>; terminate: () => Promise<unknown> };
type TBbox = { x0: number; y0: number; x1: number; y1: number };
type TLine = { text: string; bbox: TBbox; words: { text: string; bbox: TBbox }[] };
type TData = { text: string; blocks?: { paragraphs: { lines: TLine[] }[] }[] | null };

/** Voortgang van het laden van de OCR-engine (0..1). */
let initProgress = 0;
/** Voortgang van de pagina die nu gelezen wordt (0..1). */
let recognizeProgress = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

let workerPromise: Promise<TWorker> | null = null;

/**
 * Tesseract draait lokaal (WASM). Assets komen uit /public/vendor, niet van een CDN.
 * Mag vroeg aangeroepen worden (bij het kiezen van een bestand) zodat het laden
 * van de taaldata parallel loopt met het openen van de PDF.
 */
export function preloadOcr(): Promise<TWorker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      const origin = window.location.origin;
      const w = (await createWorker("nld", 1, {
        workerPath: `${origin}/vendor/tesseract/worker.min.js`,
        corePath: `${origin}/vendor/tesseract`,
        langPath: `${origin}/vendor/tesseract/lang`,
        gzip: true,
        logger: (m: TLoggerMsg) => {
          if (m.status === "recognizing text") recognizeProgress = m.progress;
          else if (m.status.startsWith("loading language")) initProgress = 0.2 + 0.7 * m.progress;
          else if (m.status.startsWith("loading tesseract")) initProgress = 0.2 * m.progress;
          else return;
          notify();
        },
      })) as unknown as TWorker;
      initProgress = 1;
      notify();
      return w;
    })();
    workerPromise.catch(() => { workerPromise = null; initProgress = 0; });
  }
  return workerPromise;
}

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

async function recognize(source: HTMLCanvasElement): Promise<OcrPage> {
  const worker = await preloadOcr();
  const { canvas, scale } = prepareForOcr(source);
  recognizeProgress = 0;
  const { data } = await worker.recognize(canvas, {}, { blocks: true, text: true });
  const toBox = (b: TBbox): Box => ({ x: b.x0 / scale, y: b.y0 / scale, w: (b.x1 - b.x0) / scale, h: (b.y1 - b.y0) / scale });
  const lines: TLine[] = (data.blocks ?? []).flatMap((b) => b.paragraphs.flatMap((p) => p.lines));
  return {
    lines: lines.map((l) => ({
      box: toBox(l.bbox),
      words: l.words.map((w): OcrWord => ({ text: w.text, box: toBox(w.bbox) })),
    })),
  };
}

/**
 * Leest alle pagina's één keer, op de originele (onafgeschermde) afbeelding.
 * Start zodra de strook geopend is, zodat het lezen loopt terwijl de gebruiker
 * balken tekent. Controleren is daarna alleen nog een snelle berekening.
 * De afbeelding verlaat het apparaat niet: Tesseract draait in een Web Worker.
 */
export type OcrJob = {
  result: Promise<OcrPage[]>;
  /** Totale voortgang 0..1 (engine laden + alle pagina's). */
  progress: () => number;
  subscribe: (fn: () => void) => () => void;
};

export function startOcr(sources: HTMLCanvasElement[]): OcrJob {
  let done = 0;
  const progress = () => {
    const pages = sources.length ? (done + (done < sources.length ? recognizeProgress : 0)) / sources.length : 1;
    return Math.min(1, 0.15 * initProgress + 0.85 * pages);
  };
  const result = (async () => {
    const out: OcrPage[] = [];
    for (const s of sources) {
      out.push(await recognize(s));
      done++;
      notify();
    }
    return out;
  })();
  return {
    result,
    progress,
    subscribe: (fn) => { listeners.add(fn); return () => { listeners.delete(fn); }; },
  };
}

/**
 * Zoekt leesbare BSN's en IBAN's die niet onder een zwarte balk vallen.
 * Leeg resultaat = upload toegestaan. De server controleert daarna nogmaals.
 */
export function hitsOutsideMasks(page: OcrPage, masks: Box[]): GateHit[] {
  return findHitsInOcr(page, masks, findBsnIban);
}
