import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/supabase/server";
import { compare } from "@/lib/stats";
import DeleteButton from "@/components/DeleteButton";
import ResultChart from "@/components/ResultChart";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Jouw salarisvergelijking", robots: { index: false, follow: false } };

const eur = (n: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const pct = (n: number) => `${Math.round(n * 100)}%`;
const dagen = (n: number) => (n === 0 ? "geen" : `${n.toLocaleString("nl-NL", { maximumFractionDigits: 1 })} ${n === 1 ? "dag" : "dagen"} per week`);

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ k?: string; u?: string }> }) {
  const { id } = await params;
  const { k, u } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const { data: s } = await db()
    .from("submissions")
    .select("functie, functie_key, sector, provincie, ervaringsband, uren_per_week, bruto_maand, bruto_maand_fte, dertiende_maand, thuiswerkdagen, lease_auto, vakantiegeld_pct, pensioen_pct, source")
    .eq("id", id)
    .eq("source", "upload")
    .maybeSingle();
  if (!s) notFound();

  const cmp = await compare(
    { functie_key: s.functie_key, sector: s.sector, provincie: s.provincie ?? "", ervaringsband: s.ervaringsband },
    Number(s.bruto_maand_fte),
  );

  const fte = Number(s.bruto_maand_fte);
  const diff = cmp ? (fte - cmp.stats.p50) / cmp.stats.p50 : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <div>
        <div className="text-sm text-slate-500">{s.functie} · {s.sector} · {s.provincie} · {s.ervaringsband} jaar ervaring</div>
        {cmp ? (
          <h1 className="text-3xl sm:text-4xl font-bold mt-1">
            Je verdient{" "}
            <span className={diff >= 0 ? "text-accent-600" : "text-red-600"}>
              {Math.abs(Math.round(diff * 100))}% {diff >= 0 ? "meer" : "minder"}
            </span>{" "}
            dan de mediaan
          </h1>
        ) : (
          <h1 className="text-3xl font-bold mt-1">Nog te weinig vergelijkbare salarissen</h1>
        )}
      </div>

      {cmp?.verbreed && (
        <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 p-4 text-sm text-amber-800">
          Er zijn nog geen 10 salarissen van mensen met dezelfde functie, sector, provincie en ervaring als jij. Om je privacy te
          beschermen tonen we pas een vergelijking vanaf 10 salarissen. Daarom vergelijken we je met een bredere groep:{" "}
          <strong>{cmp.level}</strong> ({cmp.stats.n} salarissen).{" "}
          {cmp.alles
            ? "Dit is een vergelijking met alle salarissen in onze database en zegt weinig over jouw specifieke functie. Zie het als een ruwe indicatie."
            : "Dit is minder specifiek, dus zie het als een indicatie."}
        </div>
      )}

      {u === "1" && (
        <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 p-4 text-sm text-amber-800">
          Je gegevens tellen niet mee in de statistieken, omdat de strook niet volledig gecontroleerd kon worden of omdat je gegevens sterk hebt aangepast.
        </div>
      )}

      {cmp ? (
        <>
          <div className="card">
            <ResultChart value={fte} stats={cmp.stats} />
            <p className="mt-4 text-sm text-slate-500">
              Vergeleken met {cmp.stats.n} salarissen van mensen met {cmp.level}. Bedragen omgerekend naar fulltime (40 uur), bruto per maand,
              inclusief een eventuele 13e maand (verdeeld over 12 maanden), exclusief vakantiegeld. Jouw salaris: {eur(Number(s.bruto_maand))}
              {s.dertiende_maand ? " + 13e maand (× 13/12)" : ""} voor {Number(s.uren_per_week)} uur = {eur(fte)} fulltime.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <Stat label="Jouw percentiel" value={cmp.percentile != null ? `${Math.round(cmp.percentile * 100)}e` : "–"} />
            <Stat label="Mediaan" value={eur(cmp.stats.p50)} />
            <Stat label="25% verdient minder dan" value={eur(cmp.stats.p25)} />
            <Stat label="25% verdient meer dan" value={eur(cmp.stats.p75)} />
          </div>

          <div className="card">
            <h2 className="font-semibold text-lg mb-4">Secundaire arbeidsvoorwaarden</h2>
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500"><tr><th className="pb-2">Voorwaarde</th><th className="pb-2">Jij</th><th className="pb-2">Vergelijkbaar</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="py-2">13e maand</td><td>{s.dertiende_maand ? "Ja" : "Nee"}</td><td>{cmp.stats.pct_dertiende != null ? `${pct(cmp.stats.pct_dertiende)} heeft dit` : "–"}</td></tr>
                <tr><td className="py-2">Thuiswerken</td><td>{s.thuiswerkdagen != null ? dagen(Number(s.thuiswerkdagen)) : "–"}</td><td>{cmp.stats.avg_thuiswerkdagen != null ? `gem. ${dagen(cmp.stats.avg_thuiswerkdagen)}` : "–"}</td></tr>
                <tr><td className="py-2">Leaseauto</td><td>{s.lease_auto ? "Ja" : "Nee"}</td><td>{cmp.stats.pct_lease != null ? `${pct(cmp.stats.pct_lease)} heeft dit` : "–"}</td></tr>
                <tr><td className="py-2">Vakantiegeld</td><td>{s.vakantiegeld_pct ?? "–"}%</td><td>{cmp.stats.avg_vakantiegeld != null ? `gem. ${cmp.stats.avg_vakantiegeld}%` : "–"}</td></tr>
                <tr><td className="py-2">Pensioenpremie werknemer</td><td>{s.pensioen_pct != null ? `${s.pensioen_pct}%` : "–"}</td><td>{cmp.stats.avg_pensioen != null ? `gem. ${cmp.stats.avg_pensioen}%` : "–"}</td></tr>
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="card text-slate-600">
          Om je privacy te beschermen tonen we alleen vergelijkingen met minimaal 10 salarissen. Er staan op dit moment nog te weinig salarissen in onze
          database om een vergelijking te maken, zelfs op landelijk niveau. Je gegevens helpen anderen wel. Kom later terug via deze link.
        </div>
      )}

      <div className="card space-y-3">
        <h2 className="font-semibold">Jouw gegevens</h2>
        <p className="text-sm text-slate-600">
          Bewaar deze link als je later terug wilt komen of je gegevens wilt verwijderen. We hebben geen account of e-mailadres van je, dus zonder deze link kunnen we je inzending niet terugvinden.
        </p>
        {k && <DeleteButton id={id} deleteKey={k} />}
      </div>

      <Link href="/vergelijk" className="btn-secondary">Nog een strook vergelijken</Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card !p-4 text-center">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}
