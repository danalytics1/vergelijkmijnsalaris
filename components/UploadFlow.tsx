"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MaskEditor, { renderMasked } from "./MaskEditor";
import PayslipForm, { type Prefill } from "./PayslipForm";
import type { Box, GateHit, OcrJob } from "@/lib/client/piiGate";
import type { PdfMeta } from "@/lib/client/pdfToImage";

type Page = { source: HTMLCanvasElement; masks: Box[]; hits: GateHit[] };
type Step = "upload" | "mask" | "analysing" | "form";

const ACCEPT = "application/pdf,image/png,image/jpeg,image/webp";

export default function UploadFlow({ euOnly = true }: { euOnly?: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [consent, setConsent] = useState(false);
  const [consentNudge, setConsentNudge] = useState(false);
  const consentRef = useRef<HTMLInputElement>(null);

  // Upload zonder toestemming: niet stil negeren, maar wijzen op de checkbox.
  function needConsent() {
    setConsentNudge(true);
    consentRef.current?.focus();
    consentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  const [pages, setPages] = useState<Page[]>([]);
  const [meta, setMeta] = useState<PdfMeta | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanOk, setScanOk] = useState(false);
  const [confirmMasked, setConfirmMasked] = useState(false);
  const [analysis, setAnalysis] = useState<{ token: string; verified: boolean; prefill: Prefill } | null>(null);
  const ocrJob = useRef<OcrJob | null>(null);
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);

  // Lees de strook alvast op de achtergrond terwijl de gebruiker balken tekent.
  async function startOcr(sources: HTMLCanvasElement[]) {
    const { startOcr } = await import("@/lib/client/piiGate");
    const job = startOcr(sources);
    ocrJob.current = job;
    job.result.catch(() => { if (ocrJob.current === job) ocrJob.current = null; });
  }

  useEffect(() => {
    if (step !== "mask") ocrJob.current = null;
  }, [step]);

  async function onFile(file: File) {
    setError(null);
    if (file.size > 20 * 1024 * 1024) return setError("Bestand is groter dan 20 MB.");
    setBusy("Bestand openen…");
    // OCR-engine en taaldata alvast laden, parallel aan het openen van het bestand.
    import("@/lib/client/piiGate").then((m) => m.preloadOcr()).catch(() => {});
    try {
      const { pdfToCanvases, imageToCanvas } = await import("@/lib/client/pdfToImage");
      let sources: HTMLCanvasElement[];
      if (file.type === "application/pdf") {
        const { canvases, meta } = await pdfToCanvases(file);
        setMeta(meta);
        sources = canvases;
      } else if (file.type.startsWith("image/")) {
        setMeta(null);
        sources = [await imageToCanvas(file)];
      } else {
        throw new Error("type");
      }
      setPages(sources.map((source) => ({ source, masks: [], hits: [] })));
      void startOcr(sources);
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
    let unsubscribe = () => {};
    try {
      const { hitsOutsideMasks } = await import("@/lib/client/piiGate");
      if (!ocrJob.current) await startOcr(pages.map((p) => p.source));
      const job = ocrJob.current!;
      setOcrProgress(job.progress());
      unsubscribe = job.subscribe(() => setOcrProgress(job.progress()));
      const ocr = await job.result;
      const results = pages.map((p, i) => hitsOutsideMasks(ocr[i], p.masks));
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
      unsubscribe();
      setOcrProgress(null);
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
          <div className={`rounded-xl p-4 ring-2 transition ${consent ? "bg-green-50 ring-green-300" : consentNudge ? "bg-red-50 ring-red-400" : "bg-amber-50 ring-amber-300"}`}>
            <div className="text-sm font-semibold mb-2">
              Stap 1: geef toestemming {consent ? <span className="text-green-700">✓</span> : <span className="text-red-600">(verplicht)</span>}
            </div>
            <label className="flex gap-3 items-start text-sm cursor-pointer">
              <input ref={consentRef} type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={consent}
                onChange={(e) => { setConsent(e.target.checked); if (e.target.checked) setConsentNudge(false); }} />
              <span>
                Ik geef toestemming dat mijn afgeschermde salarisstrook eenmalig door een AI-model {euOnly ? "in de EU" : "buiten de EU (Verenigde Staten)"} wordt geanalyseerd. De strook wordt
                niet opgeslagen. Alleen de geanonimiseerde salarisgegevens die ik hierna bevestig, worden bewaard. Zie de{" "}
                <a href="/privacy" target="_blank" className="text-brand-600 underline">privacyverklaring</a>.
              </span>
            </label>
            {consentNudge && !consent && (
              <p role="alert" className="mt-2 text-sm font-medium text-red-700">Vink eerst dit vakje aan. Daarna kun je je strook uploaden.</p>
            )}
          </div>
          <div className="text-sm font-semibold">Stap 2: upload je strook</div>
          <label
            onClick={(e) => { if (!consent) { e.preventDefault(); needConsent(); } }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (!consent) return needConsent(); const f = e.dataTransfer.files?.[0]; if (f && !busy) onFile(f); }}
            className={`block rounded-2xl border-2 border-dashed p-10 text-center transition ${consent ? "border-brand-500 bg-brand-50 cursor-pointer hover:bg-brand-100" : "border-slate-300 bg-slate-50 cursor-not-allowed"}`}>
            <input type="file" accept={ACCEPT} className="sr-only" disabled={!consent || !!busy} onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            <div className="text-4xl">{consent ? "📄" : "🔒"}</div>
            <div className="mt-2 font-semibold">{busy ?? (consent ? "Kies een bestand of sleep het hierheen" : "Geef eerst toestemming (stap 1)")}</div>
            <div className="text-sm text-slate-500">PDF, PNG of JPG, maximaal 20 MB</div>
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
            {busy && ocrProgress === null && <span className="text-sm text-slate-500">{busy}</span>}
          </div>
          {busy && ocrProgress !== null && <ProgressBar value={ocrProgress} label={busy} />}
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

function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm text-slate-600">
        <span>{label}</span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}>
        <div className="h-full rounded-full bg-brand-500 transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
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
