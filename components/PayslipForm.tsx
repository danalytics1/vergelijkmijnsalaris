"use client";

import { useEffect, useState } from "react";
import { PROVINCIES, SECTOREN, OPLEIDINGSNIVEAUS, SENIORITEITEN, WERKPLEZIER_LABELS } from "@/lib/schema";
import { seniority } from "@/lib/normalize";
import VaardighedenPicker from "./VaardighedenPicker";

export type Prefill = {
  functie: string | null; sector: string | null; provincie: string | null; leeftijd: number | null;
  dienstjaren: number | null; uren_per_week: number | null; bruto_maand: number | null; netto_maand: number | null;
  vakantiegeld_pct: number | null; dertiende_maand: boolean | null; pensioen_pct: number | null;
  lease_auto: boolean | null; cao: string | null; periode: string | null;
};

type Props = { prefill: Prefill; verified: boolean; busy: boolean; onSubmit: (v: Record<string, unknown>) => void };

export default function PayslipForm({ prefill, verified, busy, onSubmit }: Props) {
  const [v, setV] = useState({
    functie: prefill.functie ?? "",
    sector: prefill.sector ?? "",
    provincie: prefill.provincie ?? "",
    leeftijd: prefill.leeftijd?.toString() ?? "",
    dienstjaren: prefill.dienstjaren?.toString() ?? "",
    opleidingsniveau: "onbekend",
    uren_per_week: prefill.uren_per_week?.toString() ?? "",
    bruto_maand: prefill.bruto_maand?.toString() ?? "",
    vakantiegeld_pct: (prefill.vakantiegeld_pct ?? 8).toString(),
    dertiende_maand: prefill.dertiende_maand ?? false,
    thuiswerkdagen: "0",
    senioriteit: (prefill.functie && seniority(prefill.functie)) || "",
    werkplezier: "",
    pensioen_pct: prefill.pensioen_pct?.toString() ?? "",
    lease_auto: prefill.lease_auto ?? false,
    cao: prefill.cao ?? "",
    periode: prefill.periode ?? "",
  });
  const [vaardigheden, setVaardigheden] = useState<string[]>([]);
  const [fout, setFout] = useState<string | null>(null);
  const [suggesties, setSuggesties] = useState<string[]>([]);

  useEffect(() => {
    if (v.functie.length < 2) return;
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/functies?q=${encodeURIComponent(v.functie)}`);
        if (r.ok) setSuggesties(await r.json());
      } catch { /* negeren */ }
    }, 250);
    return () => clearTimeout(t);
  }, [v.functie]);

  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV({ ...v, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  const fromStrook = (k: keyof Prefill) => prefill[k] != null;
  const changedBruto = prefill.bruto_maand != null && v.bruto_maand !== "" && Math.abs(Number(v.bruto_maand) - prefill.bruto_maand) / prefill.bruto_maand > 0.05;

  function handle(e: React.FormEvent) {
    e.preventDefault();
    if (vaardigheden.length === 0) { setFout("Kies minstens één vaardigheid of kwalificatie."); return; }
    setFout(null);
    onSubmit({
      functie: v.functie,
      sector: v.sector,
      provincie: v.provincie,
      leeftijd: Number(v.leeftijd),
      dienstjaren: Number(v.dienstjaren),
      opleidingsniveau: v.opleidingsniveau,
      uren_per_week: Number(v.uren_per_week),
      bruto_maand: Number(v.bruto_maand),
      vakantiegeld_pct: Number(v.vakantiegeld_pct),
      dertiende_maand: v.dertiende_maand,
      thuiswerkdagen: Number(v.thuiswerkdagen),
      senioriteit: v.senioriteit,
      werkplezier: Number(v.werkplezier),
      vaardigheden,
      pensioen_pct: v.pensioen_pct === "" ? null : Number(v.pensioen_pct),
      lease_auto: v.lease_auto,
      cao: v.cao || null,
      periode: v.periode,
    });
  }

  const Tag = ({ k }: { k: keyof Prefill }) =>
    fromStrook(k) ? <span className="ml-2 text-xs font-normal text-accent-600">✓ uit strook</span> : <span className="ml-2 text-xs font-normal text-amber-600">zelf invullen</span>;

  return (
    <form onSubmit={handle} className="card space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Controleer je gegevens</h2>
        <p className="text-slate-600 mt-1">We hebben je strook uitgelezen. Klopt er iets niet of mist er iets? Pas het hier aan.</p>
        {!verified && (
          <p className="mt-3 rounded-lg bg-amber-50 ring-1 ring-amber-200 p-3 text-sm text-amber-800">
            We konden je strook niet volledig controleren. Je krijgt wel een vergelijking, maar je gegevens tellen niet mee in de statistieken.
          </p>
        )}
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Functie<Tag k="functie" /></label>
          <input className="input" required minLength={2} maxLength={100} list="functies" value={v.functie} onChange={set("functie")} />
          <datalist id="functies">{suggesties.map((s) => <option key={s} value={s} />)}</datalist>
        </div>
        <div>
          <label className="label">Sector<Tag k="sector" /></label>
          <select className="input" required value={v.sector} onChange={set("sector")}>
            <option value="">Kies…</option>
            {SECTOREN.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Provincie (werkplek)<Tag k="provincie" /></label>
          <select className="input" required value={v.provincie} onChange={set("provincie")}>
            <option value="">Kies…</option>
            {PROVINCIES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Leeftijd<Tag k="leeftijd" /></label>
          <input className="input" type="number" required min={15} max={80} value={v.leeftijd} onChange={set("leeftijd")} />
        </div>
        <div>
          <label className="label">Jaren ervaring<Tag k="dienstjaren" /></label>
          <input className="input" type="number" required min={0} max={60} step={0.5} value={v.dienstjaren} onChange={set("dienstjaren")} />
        </div>
        <div>
          <label className="label">Opleidingsniveau</label>
          <select className="input" value={v.opleidingsniveau} onChange={set("opleidingsniveau")}>
            {OPLEIDINGSNIVEAUS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Cao<Tag k="cao" /></label>
          <input className="input" maxLength={100} value={v.cao} onChange={set("cao")} placeholder="Optioneel" />
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2 border-t border-slate-200 pt-6">
        <div>
          <label className="label">Bruto maandsalaris (€)<Tag k="bruto_maand" /></label>
          <input className="input" type="number" required min={500} max={100000} step={0.01} value={v.bruto_maand} onChange={set("bruto_maand")} />
          {changedBruto && <p className="mt-1 text-xs text-amber-700">Wijkt meer dan 5% af van je strook. Je vergelijking telt dan niet mee in de statistieken.</p>}
        </div>
        <div>
          <label className="label">Uren per week<Tag k="uren_per_week" /></label>
          <input className="input" type="number" required min={1} max={60} step={0.5} value={v.uren_per_week} onChange={set("uren_per_week")} />
        </div>
        <div>
          <label className="label">Vakantiegeld (%)<Tag k="vakantiegeld_pct" /></label>
          <input className="input" type="number" required min={0} max={25} step={0.01} value={v.vakantiegeld_pct} onChange={set("vakantiegeld_pct")} />
        </div>
        <div>
          <label className="label">Pensioenpremie werknemer (% van bruto)<Tag k="pensioen_pct" /></label>
          <input className="input" type="number" min={0} max={30} step={0.1} value={v.pensioen_pct} onChange={set("pensioen_pct")} placeholder="Optioneel" />
        </div>
        <div>
          <label className="label">Periode strook<Tag k="periode" /></label>
          <input className="input" type="month" required value={v.periode} onChange={set("periode")} />
        </div>
        <div>
          <label className="label">Thuiswerkdagen per week<span className="ml-2 text-xs font-normal text-amber-600">zelf invullen</span></label>
          <select className="input" value={v.thuiswerkdagen} onChange={set("thuiswerkdagen")}>
            {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((d) => (
              <option key={d} value={String(d)}>{d === 0 ? "Geen" : `${String(d).replace(".", ",")} ${d === 1 ? "dag" : "dagen"}`}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-3 justify-end">
          <div>
            <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4" checked={v.dertiende_maand} onChange={set("dertiende_maand")} /> 13e maand / eindejaarsuitkering</label>
            <p className="ml-6 text-xs text-slate-500">Telt mee in je salaris: we rekenen met 13/12 van je maandsalaris (+8,33%).</p>
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4" checked={v.lease_auto} onChange={set("lease_auto")} /> Leaseauto</label>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-slate-200 pt-6">
        <div>
          <h3 className="font-semibold">Over je werk</h3>
          <p className="text-sm text-slate-600">Deze vragen staan niet op je strook. Ze helpen om salarissen eerlijker te vergelijken.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Senioriteit</label>
            <select className="input" required value={v.senioriteit} onChange={set("senioriteit")}>
              <option value="">Kies…</option>
              {SENIORITEITEN.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <span className="label">Hoeveel plezier heb je in je werk?</span>
            <div className="mt-1 grid grid-cols-5 gap-1" role="radiogroup" aria-label="Werkplezier">
              {WERKPLEZIER_LABELS.map((label, i) => (
                <label key={label} className={`cursor-pointer rounded-lg px-1 py-2 text-center text-xs ring-1 ${v.werkplezier === String(i + 1) ? "bg-accent-600 text-white ring-accent-600" : "ring-slate-300 hover:ring-accent-600"}`}>
                  <input type="radio" name="werkplezier" className="sr-only" required value={String(i + 1)} checked={v.werkplezier === String(i + 1)} onChange={set("werkplezier")} />
                  <span className="block text-base font-semibold">{i + 1}</span>{label}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className="label">Je drie belangrijkste vaardigheden of kwalificaties</label>
          <p className="text-xs text-slate-500 mb-2">Kies er maximaal 3 uit de lijst, in volgorde van belang.</p>
          <VaardighedenPicker value={vaardigheden} onChange={(x) => { setVaardigheden(x); if (x.length) setFout(null); }} />
          {fout && <p className="mt-1 text-sm text-red-700">{fout}</p>}
        </div>
      </fieldset>

      <button className="btn-primary w-full text-lg" disabled={busy}>{busy ? "Bezig…" : "Vergelijk mijn salaris →"}</button>
    </form>
  );
}
