"use client";

import { useMemo, useState } from "react";
import { VAARDIGHEDEN_GROEPEN, MAX_VAARDIGHEDEN } from "@/lib/vaardigheden";

type Props = { value: string[]; onChange: (v: string[]) => void };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function VaardighedenPicker({ value, onChange }: Props) {
  const [q, setQ] = useState("");
  const vol = value.length >= MAX_VAARDIGHEDEN;

  const groepen = useMemo(() => {
    const n = norm(q.trim());
    return Object.entries(VAARDIGHEDEN_GROEPEN)
      .map(([groep, items]) => [groep, (items as readonly string[]).filter((i) => !n || norm(i).includes(n))] as const)
      .filter(([, items]) => items.length > 0);
  }, [q]);

  const toggle = (item: string) => {
    if (value.includes(item)) onChange(value.filter((x) => x !== item));
    else if (!vol) onChange([...value, item]);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 min-h-9">
        {value.length === 0 && <span className="text-sm text-slate-500">Nog niets gekozen</span>}
        {value.map((item, i) => (
          <button type="button" key={item} onClick={() => toggle(item)}
            className="inline-flex items-center gap-1 rounded-full bg-accent-600 px-3 py-1 text-sm text-white"
            aria-label={`${item} verwijderen`}>
            <span className="text-xs opacity-80">{i + 1}.</span> {item} <span aria-hidden>×</span>
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500">{value.length}/{MAX_VAARDIGHEDEN}</span>
      </div>

      <input className="input mt-2" type="search" placeholder="Zoek, bv. Python, CFA, Wft, Analytisch…"
        value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="mt-2 max-h-64 overflow-y-auto rounded-lg ring-1 ring-slate-200 p-3 space-y-3">
        {groepen.length === 0 && <p className="text-sm text-slate-500">Geen resultaten. Kies de vaardigheid die er het dichtst bij komt.</p>}
        {groepen.map(([groep, items]) => (
          <div key={groep}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{groep}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {items.map((item) => {
                const on = value.includes(item);
                return (
                  <button type="button" key={item} onClick={() => toggle(item)} disabled={!on && vol}
                    aria-pressed={on}
                    className={`rounded-full px-3 py-1 text-sm ring-1 transition ${on
                      ? "bg-accent-600 text-white ring-accent-600"
                      : "bg-white text-slate-700 ring-slate-300 hover:ring-accent-600 disabled:opacity-40 disabled:hover:ring-slate-300"}`}>
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
