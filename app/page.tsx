import Link from "next/link";
import { llmInfo } from "@/lib/llm/provider";

const EU = llmInfo().euOnly;

const STAPPEN = [
  { n: "01", k: "upload", t: "Upload je salarisstrook", d: "PDF of screenshot. BSN en IBAN scherm je af in je browser; die verlaten je apparaat nooit." },
  { n: "02", k: "controle", t: "Controleer je gegevens", d: "Wij lezen de strook uit en vullen het formulier. Jij checkt en vult aan." },
  { n: "03", k: "resultaat", t: "Zie je positie", d: "Percentiel, mediaan en spreiding in jouw functie, sector en regio." },
];

const USPS = [
  { k: "anoniem", d: "Geen account, naam, e-mail of adres. Je strook wordt na de analyse direct weggegooid." },
  { k: "geverifieerd", d: "Alleen gecontroleerde stroken, geen zelf ingevulde bedragen." },
  { k: "gratis", d: "Vergelijken kost niets, je zit nergens aan vast." },
  { k: "avg", d: EU ? "EU-verwerking, dataminimalisatie, recht op verwijdering." : "Dataminimalisatie, geen opslag van je strook, recht op verwijdering." },
];

const NIET = ["Je salarisstrook (PDF of afbeelding)", "Naam en adres", "BSN en IBAN", "Geboortedatum", "Werkgever", "E-mailadres of account"];
const WEL = ["Functie en sector", "Provincie", "Leeftijds- en ervaringscategorie", "Bruto salaris en uren", "Arbeidsvoorwaarden (13e maand, pensioen, …)"];

// Voorbeeldverdeling (illustratief); index 6 is "jij".
const BARS = [9, 21, 38, 61, 100, 92, 78, 55, 34, 20, 9];
const JIJ = 6;

export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 font-mono text-xs text-fg-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" aria-hidden />
          geen persoonsgegevens opgeslagen · strook direct verwijderd
        </div>
        <h1 className="mt-6 max-w-3xl text-5xl sm:text-7xl font-bold tracking-tight leading-[0.95]">
          Weet precies waar je salaris staat.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-fg-muted">
          Upload je strook. Wij plaatsen je in de verdeling van echte salarissen in jouw functie, sector en regio. Anoniem, gratis, in 2 minuten.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/vergelijk" className="btn-primary">Upload salarisstrook →</Link>
          <Link href="/hoe-werkt-het" className="btn-secondary">Bekijk de methode</Link>
        </div>

        <div className="mt-14 rounded-xl bg-surface ring-1 ring-line overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4 font-mono text-xs text-fg-muted">
            <span className="truncate">VOORBEELD · software developer / ICT / Utrecht / 5-10 jr</span>
            <span className="shrink-0">n = 142</span>
          </div>
          <div className="grid gap-8 p-6 md:grid-cols-[1fr_16rem] md:items-end">
            <div>
              <div className="flex h-48 items-end gap-1.5" aria-hidden>
                {BARS.map((h, i) => (
                  <div key={i} className={`flex-1 rounded-sm ${i === JIJ ? "bg-lime" : "bg-line-strong"}`} style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="mt-3 flex justify-between font-mono text-xs text-fg-subtle">
                <span>€3.800</span><span>P50 €4.650</span><span>€6.200</span>
              </div>
            </div>
            <div>
              <div className="font-mono text-xs text-fg-subtle">JOUW POSITIE</div>
              <div className="mt-1 text-5xl font-bold tracking-tight text-lime">+8%</div>
              <div className="text-fg-muted">boven de mediaan</div>
              <div className="mt-6 grid grid-cols-2 rounded-lg ring-1 ring-line divide-x divide-line">
                <div className="p-3"><div className="text-xl font-semibold">P64</div><div className="text-xs text-fg-subtle">percentiel</div></div>
                <div className="p-3"><div className="text-xl font-semibold">38%</div><div className="text-xs text-fg-subtle">13e maand</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="eyebrow">/ proces</div>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">Drie stappen, twee minuten</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {STAPPEN.map((s) => (
              <div key={s.n} className="card">
                <div className="font-mono text-xs text-fg-subtle">{s.n} / {s.k}</div>
                <h3 className="mt-4 text-lg font-semibold">{s.t}</h3>
                <p className="mt-2 text-fg-muted">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="eyebrow">/ privacy</div>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">Geen persoonsgegevens. Alleen anonieme cijfers.</h2>
          <p className="mt-4 max-w-2xl text-fg-muted">
            We willen niet weten wie je bent. Je strook wordt alleen tijdens de analyse gelezen en daarna weggegooid. Wat overblijft is een anonieme
            salarisregel zonder naam, nummer of werkgever.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="card">
              <div className="font-mono text-xs text-fg-subtle">nooit opgeslagen</div>
              <ul className="mt-4 space-y-2">
                {NIET.map((x) => (
                  <li key={x} className="flex gap-3"><span className="text-red-400" aria-hidden>✕</span><span>{x}</span></li>
                ))}
              </ul>
            </div>
            <div className="card">
              <div className="font-mono text-xs text-fg-subtle">wel bewaard, anoniem</div>
              <ul className="mt-4 space-y-2">
                {WEL.map((x) => (
                  <li key={x} className="flex gap-3"><span className="text-lime" aria-hidden>✓</span><span>{x}</span></li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-fg-subtle">
                Vergelijkingen tonen we alleen voor groepen van minimaal 10 mensen. Je kunt je inzending altijd zelf verwijderen via je resultaatlink.
              </p>
            </div>
          </div>
          <Link href="/privacy" className="mt-6 inline-block text-sm text-fg-muted underline underline-offset-4 hover:text-fg">Lees de privacyverklaring</Link>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {USPS.map((u) => (
            <div key={u.k}>
              <div className="eyebrow">{u.k}</div>
              <p className="mt-2 text-fg-muted">{u.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="rounded-xl bg-lime text-ink p-8 sm:p-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Zelf ingevulde salarissen liegen.</h2>
            <p className="mt-2 text-ink/80">Mensen ronden af en overdrijven. Daarom vergelijken wij alleen met echte stroken.</p>
          </div>
          <Link href="/vergelijk" className="btn shrink-0 bg-ink text-fg hover:bg-surface">Start de vergelijking →</Link>
        </div>
      </section>
    </>
  );
}
