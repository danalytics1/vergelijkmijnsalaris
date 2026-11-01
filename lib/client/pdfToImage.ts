"use client";

export type PdfMeta = { producer: string | null; creator: string | null };

/**
 * Rendert een PDF volledig in de browser naar canvassen. De PDF zelf wordt
 * nooit geüpload; alleen de (afgeschermde) afbeelding gaat verder.
 */
export async function pdfToCanvases(file: File, maxPages = 3): Promise<{ canvases: HTMLCanvasElement[]; meta: PdfMeta }> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.mjs";

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data, isEvalSupported: false, disableFontFace: false }).promise;

  let meta: PdfMeta = { producer: null, creator: null };
  try {
    const m = await doc.getMetadata();
    const info = m.info as Record<string, unknown>;
    meta = {
      producer: typeof info.Producer === "string" ? info.Producer.slice(0, 200) : null,
      creator: typeof info.Creator === "string" ? info.Creator.slice(0, 200) : null,
    };
  } catch { /* geen metadata */ }

  const canvases: HTMLCanvasElement[] = [];
  for (let i = 1; i <= Math.min(doc.numPages, maxPages); i++) {
    const page = await doc.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(2.5, 1800 / base.width);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    canvases.push(canvas);
  }
  await doc.destroy();
  return { canvases, meta };
}

/** Laadt een screenshot/foto in een canvas. Hertekenen verwijdert EXIF (o.a. GPS). */
export async function imageToCanvas(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

export function canvasToJpeg(canvas: HTMLCanvasElement, maxSide = 2000, quality = 0.85): Promise<Blob> {
  const scale = Math.min(1, maxSide / Math.max(canvas.width, canvas.height));
  const out = document.createElement("canvas");
  out.width = Math.round(canvas.width * scale);
  out.height = Math.round(canvas.height * scale);
  out.getContext("2d")!.drawImage(canvas, 0, 0, out.width, out.height);
  return new Promise((resolve, reject) => out.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/jpeg", quality));
}
