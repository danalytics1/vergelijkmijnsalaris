import { asNiveaus, yDomein, SENIORITEIT_LABELS, type GroeiPunt, type Senioriteit } from "@/lib/groei";

const eur = (n: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const kort = (n: number) => `€${(n / 1000).toLocaleString("nl-NL", { maximumFractionDigits: 1 })}k`;

/**
 * Salaris per senioriteit: P25–P75 als staaf, mediaan als lijn, jouw salaris als marker.
 * Niveaus zonder (genoeg) data blijven op de as staan zonder punt. Server-rendered SVG, geen JS.
 */
type Props = { punten: GroeiPunt[]; eigen: Senioriteit | null; value: number };

/** Twee varianten zodat de tekst op mobiel leesbaar blijft (viewBox schaalt mee met de breedte). */
export default function GroeiChart(props: Props) {
  return (
    <>
      <Grafiek {...props} W={420} className="w-full h-auto sm:hidden" />
      <Grafiek {...props} W={800} className="w-full h-auto hidden sm:block" />
    </>
  );
}

function Grafiek({ punten, eigen, value, W, className }: Props & { W: number; className: string }) {
  const niveaus = asNiveaus(punten, eigen);
  const { min: yMin, max: yMax, ticks } = yDomein(punten, value);
  const smal = W < 600;
  const H = smal ? 240 : 260, padL = smal ? 48 : 64, padR = smal ? 8 : 24, padT = 24;
  const stap = (W - padL - padR) / niveaus.length;
  const x = (s: Senioriteit) => padL + stap * (niveaus.indexOf(s) + 0.5);
  const y = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * (H - padT);
  const perNiveau = new Map(punten.map((p) => [p.seniority, p]));
  const bw = Math.min(56, stap * 0.45);
  const flip = eigen != null && x(eigen) > W * 0.6;

  // Mediaanlijn: doorgetrokken tussen aangrenzende niveaus, gestippeld over een gat.
  const segmenten = punten.slice(1).map((p, i) => {
    const a = punten[i];
    return { a, b: p, gat: niveaus.indexOf(p.seniority) - niveaus.indexOf(a.seniority) > 1 };
  });
  const eigenPunt = eigen ? perNiveau.get(eigen) : undefined;
  const label = punten.map((p) => `${SENIORITEIT_LABELS[p.seniority]} ${eur(p.p50)}`).join(", ");

  return (
    <svg viewBox={`0 0 ${W} ${H + 44}`} className={className} role="img"
      aria-label={`Mediaan salaris per senioriteit: ${label}. Jouw salaris ${eur(value)}${eigen ? ` als ${SENIORITEIT_LABELS[eigen].toLowerCase()}` : ""}.`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#232a34" strokeWidth={1} />
          <text x={padL - 10} y={y(t) + 4} textAnchor="end" fontSize={13} fill="#7b8494" fontFamily="var(--font-mono)">{kort(t)}</text>
        </g>
      ))}

      {niveaus.map((s) => {
        const p = perNiveau.get(s);
        return (
          <g key={s}>
            {p && <rect x={x(s) - bw / 2} y={y(p.p75)} width={bw} height={Math.max(2, y(p.p25) - y(p.p75))} rx={4} fill="#2f3744" />}
            <text x={x(s)} y={H + 22} textAnchor="middle" fontSize={15} fontWeight={s === eigen ? 700 : 400} fill={s === eigen ? "#e6e9ee" : "#a9b0bc"}>{SENIORITEIT_LABELS[s]}</text>
            <text x={x(s)} y={H + 40} textAnchor="middle" fontSize={12} fill="#7b8494" fontFamily="var(--font-mono)">{p ? `n=${p.n}` : smal ? "–" : "te weinig data"}</text>
          </g>
        );
      })}

      {segmenten.map(({ a, b, gat }) => (
        <line key={b.seniority} x1={x(a.seniority)} y1={y(a.p50)} x2={x(b.seniority)} y2={y(b.p50)} stroke="#a9b0bc" strokeWidth={2} strokeDasharray={gat ? "4 4" : undefined} />
      ))}
      {punten.map((p) => (
        <g key={p.seniority}>
          <circle cx={x(p.seniority)} cy={y(p.p50)} r={5} fill="#a9b0bc" />
          {p.seniority !== eigen && (
            <text x={x(p.seniority)} y={y(p.p75) - 8} textAnchor="middle" fontSize={13} fill="#a9b0bc" fontFamily="var(--font-mono)">{eur(p.p50)}</text>
          )}
        </g>
      ))}

      {eigen && (
        <g>
          <circle cx={x(eigen)} cy={y(value)} r={9} fill="#c8f031" stroke="#0f1318" strokeWidth={3} />
          <text x={x(eigen)} y={flip ? y(value) + 30 : y(value) + 5} dx={flip ? 0 : bw / 2 + 10} fontSize={14} fontWeight={700} fill="#c8f031"
            textAnchor={flip ? "middle" : "start"}>
            jij: {eur(value)}
          </text>
          {eigenPunt && (
            <text x={x(eigen)} y={y(eigenPunt.p75) - 8} textAnchor="middle" fontSize={13} fill="#a9b0bc" fontFamily="var(--font-mono)">{eur(eigenPunt.p50)}</text>
          )}
        </g>
      )}
    </svg>
  );
}
