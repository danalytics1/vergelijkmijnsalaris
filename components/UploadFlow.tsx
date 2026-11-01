"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MaskEditor, { renderMasked } from "./MaskEditor";
import PayslipForm, { type Prefill } from "./PayslipForm";
import type { Box, GateHit } from "@/lib/client/piiGate";
import type { PdfMeta } from "@/lib/client/pdfToImage";

type Page = { source: HTMLCanvasElement; masks: Box[]; hits: GateHit[] };
type Step = "upload" | "mask" | "analysing" | "form";

const ACCEPT = "application/pdf,image/png,image/jpeg,image/webp";

export default function UploadFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [consent, setConsent] = useState(false);
  const [pages, setPages] = useState<Page[]>([]);
  const [meta, setMeta] = useState<PdfMeta | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanOk, setScanOk] = useState(false);
  const [confirmMasked, setConfirmMasked] = useState(false);
  const [analysis, setAnalysis] = useState<{ token: string; verified: boolean; prefill: Prefill } | null>(null);

  async function onFile(file: File) {
    setError(null);
    if (file.size > 20 * 1024 * 1024) return setError("Bestand is groter dan 20 MB.");
    setBusy("Bestand openen…");
    try {
      const { pdfToCanvases, imageToCanvas } = await import("@/lib/client/pdfToImage");
      if (file.type === "application/pdf") {
        const { canvases, meta } = await pdfToCanvases(file);
        setMeta(meta);
        setPages(canvases.map((source) => ({ source, masks: [], hits: [] })));
      } else if (file.type.startsWith("image/")) {
        setMeta(null);
        setPages([{ source: await imageToCanvas(file), masks: [], hits: [] }]);
      } else {
        throw new Error("type");
      }
      setScanOk(false);
      setConfirmMasked(false);
      setStep("mask");
    } catch {
      setError("Dit bestand kunnen we niet openen. Gebruik een PDF, PNG of JPG.");
    } finally {
      setBusy(null);
    }
  }

  function updateMasks(i: number, masks: Box[]) {
    setScanOk(false);
    setPages((ps) => ps.map((p, j) => (j === i ? { ...p, masks, hits: [] } : p)));
  }

  async function scan() {
    setError(null);
    setBusy("Controleren op zichtbaar BSN/IBAN… (dit gebeurt op je eigen apparaat)");
    try {
      const { scanForBsnIban } = await import("@/lib/client/piiGate");
      const results = await Promise.all(pages.map((p) => scanForBsnIban(renderMasked(p.source, p.masks))));
      setPages((ps) => ps.map((p, i) => ({ ...p, hits: results[i] })));
      const total = results.reduce((n, r) => n + r.length, 0);
      if (total > 0) {
        setScanOk(false);
        const unlocated = results.flat().filter((h) => h.box.w === 0).map((h) => `"${h.match}"`);
        setError(
          unlocated.length
            ? `We lezen nog ${total} BSN- of IBAN-achtig nummer${total > 1 ? "s" : ""}, maar kunnen ${unlocated.length > 1 ? "ze" : "het"} niet precies aanwijzen: ${unlocated.join(", ")}. Zoek dit nummer op je strook, maak het zwart en controleer opnieuw.`
            : `We zien nog ${total} leesbaar BSN- of IBAN-nummer${total > 1 ? "s" : ""} (rood omlijnd). Maak deze zwart en controleer opnieuw.`,
        );
      } else {
        setScanOk(true);
      }
    } catch {
      setError("De controle kon niet worden uitgevoerd in je browser. Probeer een recente versie van Chrome, Edge, Firefox of Safari.");
    } finally {
      setBusy(null);
    }
  }

  async function analyse() {
    setError(null);
    setStep("analysing");
    try {
      const { canvasToJpeg } = await import("@/lib/client/pdfToImage");
      const fd = new FormData();
      fd.set("consent", String(consent));
      fd.set("masked", String(scanOk && confirmMasked));
      if (meta) fd.set("pdfMeta", JSON.stringify(meta));
      for (const [i, p] of pages.entries()) fd.append("pages", await canvasToJpeg(renderMasked(p.source, p.masks)), `pagina-${i + 1}.jpg`);

      const res = await fetch("/api/analyse", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Er ging iets mis.");
        setStep(json.error === "pii_visible" ? "mask" : "upload");
        if (json.error === "pii_visible") setScanOk(false);
        return;
      }
      setAnalysis(json);
      // Afbeeldingen zijn niet meer nodig: wis ze uit het geheugen van de pagina.
      setPages([]);
      setStep("form");
    } catch {
      setError("Er ging iets mis met de verbinding. Probeer het opnieuw.");
      setStep("mask");
    }
  }

  async function submit(values: Record<string, unknown>) {
    setError(null);
    setBusy("Vergelijken…");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: analysis!.token, submission: values }),
      });
      const json = await res.json();
      if (!res.ok) return setError(json.message ?? "Er ging iets mis.");
      router.push(`/resultaat/${json.id}?k=${encodeURIComponent(json.deleteKey)}${json.counts_in_stats ? "" : "&u=1"}`);
    } catch {
      setError("Er ging iets mis met de verbinding.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <Stepper step={step} />

      {error && <div role="alert" className="rounded-xl bg-red-50 text-red-800 ring-1 ring-red-200 p-4">{error}</div>}

      {step === "upload" && (
        <div className="card space-y-5">
          <h2 className="text-xl font-semibold">Upload je salarisstrook</h2>
          <p className="text-slate-600">
            Een PDF of een screenshot van je meest recente salarisstrook. In de volgende stap scherm je je <strong>BSN en IBAN</strong> af.
            Dat gebeurt volledig in je browser: de originele strook verlaat je apparaat niet.
          </p>
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f && consent && !busy) onFile(f); }}
            className={`block rounded-2xl border-2 border-dashed p-10 text-center transition ${consent ? "border-brand-500 bg-brand-50 cursor-pointer hover:bg-brand-100" : "border-slate-300 bg-slate-50 opacity-60 cursor-not-allowed"}`}>
            <input type="file" accept={ACCEPT} className="sr-only" disabled={!consent || !!busy} onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            <div className="text-4xl">📄</div>
            <div className="mt-2 font-semibold">{busy ?? "Kies een bestand of sleep het hierheen"}</div>
            <div className="text-sm text-slate-500">PDF, PNG of JPG, maximaal 20 MB</div>
          </label>
          <label className="flex gap-3 items-start text-sm">
            <input type="checkbox" className="mt-1 h-4 w-4" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>
              Ik geef toestemming dat mijn afgeschermde salarisstrook eenmalig door een AI-model in de EU wordt geanalyseerd. De strook wordt
              niet opgeslagen. Alleen de geanonimiseerde salarisgegevens die ik hierna bevestig, worden bewaard. Zie de{" "}
              <a href="/privacy" target="_blank" className="text-brand-600 underline">privacyverklaring</a>.
            </span>
          </label>
        </div>
      )}

      {step === "mask" && (
        <div className="card space-y-5">
          <div>
            <h2 className="text-xl font-semibold">Scherm je BSN en IBAN af <span className="text-red-600">(verplicht)</span></h2>
            <p className="text-slate-600 mt-1">
              Trek met je muis of vinger een zwarte balk over je <strong>BSN</strong> en <strong>IBAN</strong>. Je mag ook je naam en adres afschermen.
              Laat de bedragen, de periode en je functie zichtbaar. Klik daarna op <em>Controleren</em>.
            </p>
          </div>
          {pages.map((p, i) => (
            <div key={i}>
              {pages.length > 1 && <div className="text-sm font-medium mb-1">Pagina {i + 1}</div>}
              <MaskEditor source={p.source} masks={p.masks} hits={p.hits} onMasksChange={(m) => updateMasks(i, m)} />
            </div>
          ))}
          <div className="flex flex-wrap gap-3 items-center">
            <button className="btn-secondary" onClick={() => { setPages([]); setStep("upload"); }}>Ander bestand</button>
            <button className="btn-primary" disabled={!!busy} onClick={scan}>{busy ? "Bezig…" : "Controleren"}</button>
            {busy && <span className="text-sm text-slate-500">{busy}</span>}
          </div>
          {scanOk && (
            <div className="rounded-xl bg-green-50 ring-1 ring-green-200 p-4 space-y-3">
              <div className="text-green-800 font-medium">✓ Geen leesbaar BSN of IBAN gevonden.</div>
              <label className="flex gap-3 items-start text-sm">
                <input type="checkbox" className="mt-1 h-4 w-4" checked={confirmMasked} onChange={(e) => setConfirmMasked(e.target.checked)} />
                <span>Ik bevestig dat mijn BSN en IBAN niet meer leesbaar zijn op deze afbeelding.</span>
              </label>
              <button className="btn-primary" disabled={!confirmMasked} onClick={analyse}>Analyseer mijn strook →</button>
            </div>
          )}
        </div>
      )}

      {step === "analysing" && (
        <div className="card text-center py-16">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-500" />
          <div className="mt-4 font-semibold">Je strook wordt geanalyseerd…</div>
          <div className="text-sm text-slate-500">Dit duurt meestal 10 tot 20 seconden.</div>
        </div>
      )}

      {step === "form" && analysis && (
        <PayslipForm prefill={analysis.prefill} verified={analysis.verified} busy={!!busy} onSubmit={submit} />
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps = [
    { id: ["upload"], label: "Uploaden" },
    { id: ["mask"], label: "Afschermen" },
    { id: ["analysing", "form"], label: "Controleren" },
    { id: [], label: "Resultaat" },
  ];
  const active = steps.findIndex((s) => s.id.includes(step));
  return (
    <ol className="flex items-center gap-2 text-sm">
      {steps.map((s, i) => (
        <li key={s.label} className="flex items-center gap-2 flex-1">
          <span className={`h-7 w-7 shrink-0 rounded-full grid place-items-center font-semibold ${i <= active ? "bg-brand-500 text-white" : "bg-slate-200 text-slate-500"}`}>{i + 1}</span>
          <span className={`hidden sm:inline ${i === active ? "font-semibold" : "text-slate-500"}`}>{s.label}</span>
          {i < steps.length - 1 && <span className="flex-1 h-px bg-slate-300" />}
        </li>
      ))}
    </ol>
  );
}
