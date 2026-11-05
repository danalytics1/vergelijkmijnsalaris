"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Box, GateHit } from "@/lib/client/piiGate";

type Props = {
  source: HTMLCanvasElement;
  masks: Box[];
  hits: GateHit[];
  onMasksChange: (masks: Box[]) => void;
};

/** Teken het afgeschermde resultaat: bron + zwarte balken (pixels worden echt overschreven). */
export function renderMasked(source: HTMLCanvasElement, masks: Box[]): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext("2d")!;
  ctx.drawImage(source, 0, 0);
  ctx.fillStyle = "#000";
  for (const m of masks) ctx.fillRect(m.x, m.y, m.w, m.h);
  return out;
}

export default function MaskEditor({ source, masks, hits, onMasksChange }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [draft, setDraft] = useState<Box | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  const draw = useCallback(() => {
    const c = ref.current;
    if (!c) return;
    c.width = source.width;
    c.height = source.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(source, 0, 0);
    ctx.fillStyle = "#000";
    for (const m of masks) ctx.fillRect(m.x, m.y, m.w, m.h);
    const lw = Math.max(2, source.width / 400);
    ctx.lineWidth = lw;
    ctx.strokeStyle = "#dc2626";
    for (const h of hits) if (h.box.w > 0) ctx.strokeRect(h.box.x - lw * 2, h.box.y - lw * 2, h.box.w + lw * 4, h.box.h + lw * 4);
    if (draft) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(draft.x, draft.y, draft.w, draft.h);
    }
  }, [source, masks, hits, draft]);

  useEffect(draw, [draw]);

  const toCanvas = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * source.width, y: ((e.clientY - r.top) / r.height) * source.height };
  };

  const norm = (a: { x: number; y: number }, b: { x: number; y: number }): Box => ({
    x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y),
  });

  return (
    <div>
      <canvas
        ref={ref}
        className="w-full h-auto rounded-lg ring-1 ring-line-strong cursor-crosshair touch-none select-none bg-white"
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture(e.pointerId);
          start.current = toCanvas(e);
        }}
        onPointerMove={(e) => {
          if (start.current) setDraft(norm(start.current, toCanvas(e)));
        }}
        onPointerUp={(e) => {
          if (start.current) {
            const box = norm(start.current, toCanvas(e));
            if (box.w > 5 && box.h > 5) onMasksChange([...masks, box]);
          }
          start.current = null;
          setDraft(null);
        }}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary !py-2 text-sm" disabled={!masks.length} onClick={() => onMasksChange(masks.slice(0, -1))}>
          ↶ Laatste balk ongedaan maken
        </button>
        {hits.some((h) => h.box.w > 0) && (
          <button
            type="button"
            className="btn !py-2 text-sm bg-red-600 text-white hover:bg-red-700"
            onClick={() => {
              const pad = Math.max(4, source.width / 200);
              onMasksChange([...masks, ...hits.filter((h) => h.box.w > 0).map((h) => ({ x: h.box.x - pad, y: h.box.y - pad, w: h.box.w + pad * 2, h: h.box.h + pad * 2 }))]);
            }}
          >
            Gevonden nummers zwart maken
          </button>
        )}
      </div>
    </div>
  );
}
