import Link from "next/link";
import { llmInfo } from "@/lib/llm/provider";

const STAPPEN = [
  { n: 1, t: "Upload je salarisstrook", d: "PDF of screenshot. Je schermt BSN en IBAN af in je browser. Die gegevens verlaten je apparaat nooit." },
  { n: 2, t: "Controleer je gegevens", d: "Onze AI leest je strook uit en vult het formulier in. Jij controleert en vult aan." },
  { n: 3, t: "Zie waar je staat", d: "Direct inzicht: verdien je meer of minder dan vergelijkbare collega's in jouw functie, sector en regio?" },
];

const EU = llmInfo().euOnly;

const USPS = [
  { t: "100% anoniem", d: "Geen account, geen naam, geen adres. We bewaren je strook niet." },
  { t: "Echte salarissen", d: "Elke vergelijking is gebaseerd op gecontroleerde salarisstroken, geen schattingen." },
  { t: "Gratis", d: "Vergelijken kost niets en je zit nergens aan vast." },
  { t: "AVG-proof", d: EU ? "Verwerking alleen in de EU, dataminimalisatie en het recht om je gegevens te laten verwijderen." : "Dataminimalisatie, geen opslag van je strook en het recht om je gegevens te laten verwijderen." },
];

export default function Home() {
  return (
    <>
      <section className="bg-gradient-to-br from-brand-600 to-brand-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24 grid gap-10 md:grid-cols-2 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">Verdien jij wat je waard bent?</h1>
            <p className="mt-4 text-lg text-brand-100">
              Upload je salarisstrook en vergelijk je salaris in 2 minuten met vergelijkbare banen. Anoniem, gratis en gebaseerd op echte stroken.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/vergelijk" className="btn-primary text-lg">Vergelijk mijn salaris →</Link>
              <Link href="/hoe-werkt-het" className="btn bg-white/10 text-white ring-1 ring-white/30 hover:bg-white/20">Hoe werkt het?</Link>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-brand-100">
              <li>✓ Geen account nodig</li>
              <li>✓ Strook wordt niet opgeslagen</li>
              {EU && <li>✓ Verwerking in de EU</li>}
            </ul>
          </div>
          <div className="card text-slate-800">
            <div className="text-sm text-slate-500">Voorbeeldresultaat</div>
            <div className="mt-1 text-2xl font-bold">Je verdient <span className="text-accent-600">8% meer</span> dan gemiddeld</div>
            <div className="mt-1 text-sm text-slate-500">Software developer · ICT · Utrecht · 5-10 jaar ervaring</div>
            <div className="mt-6 h-3 rounded-full bg-gradient-to-r from-red-300 via-yellow-200 to-green-300 relative">
              <div className="absolute -top-1.5 h-6 w-1.5 rounded bg-slate-900" style={{ left: "64%" }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-500"><span>€3.800</span><span>mediaan €4.650</span><span>€6.200</span></div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-lg bg-slate-50 p-3"><div className="font-bold">64e</div><div className="text-slate-500">percentiel</div></div>
              <div className="rounded-lg bg-slate-50 p-3"><div className="font-bold">142</div><div className="text-slate-500">vergelijkbaar</div></div>
              <div className="rounded-lg bg-slate-50 p-3"><div className="font-bold">38%</div><div className="text-slate-500">13e maand</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold text-center">Zo werkt het</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STAPPEN.map((s) => (
            <div key={s.n} className="card">
              <div className="h-10 w-10 rounded-full bg-brand-50 text-brand-600 font-bold grid place-items-center">{s.n}</div>
              <h3 className="mt-4 font-semibold text-lg">{s.t}</h3>
              <p className="mt-2 text-slate-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {USPS.map((u) => (
            <div key={u.t}>
              <div className="text-accent-600 text-2xl">✓</div>
              <h3 className="font-semibold mt-2">{u.t}</h3>
              <p className="text-slate-600 mt-1 text-sm">{u.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-3xl font-bold">Waarom een salarisstrook verplicht is</h2>
        <p className="mt-4 text-slate-600">
          Salarisvergelijkers waar je zelf een bedrag invult zijn onbetrouwbaar: mensen ronden af, overdrijven of vullen onzin in.
          Doordat iedereen een echte strook uploadt, vergelijk je met echte salarissen.
        </p>
        <Link href="/vergelijk" className="btn-primary mt-8 text-lg">Start de vergelijking</Link>
      </section>
    </>
  );
}
