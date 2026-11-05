import type { PeerStats } from "@/lib/stats";

const eur = (n: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

/** Verdeling als staafdiagram (banden van €250) met jouw positie. Server-rendered SVG, geen JS. */
export default function ResultChart({ value, stats }: { value: number; stats: PeerStats }) {
  const bars = stats.histogram;
  const min = Math.min(stats.p10, value, bars[0]?.van ?? stats.p10) - 250;
  const max = Math.max(stats.p90, value, (bars.at(-1)?.van ?? stats.p90) + 250) + 250;
  const W = 800, H = 220, pad = 30;
  const x = (v: number) => pad + ((v - min) / (max - min)) * (W - pad * 2);
  const maxN = Math.max(1, ...bars.map((b) => b.n));
  const bw = Math.max(2, x(250) - x(0) - 2);

  return (
    <svg viewBox={`0 0 ${W} ${H + 40}`} className="w-full h-auto" role="img" aria-label={`Salarisverdeling, jouw salaris ${eur(value)}, mediaan ${eur(stats.p50)}`}>
      <rect x={x(stats.p25)} y={0} width={x(stats.p75) - x(stats.p25)} height={H} fill="#181d25" />
      {bars.map((b) => {
        const h = (b.n / maxN) * (H - 30);
        return <rect key={b.van} x={x(b.van) + 1} y={H - h} width={bw} height={h} rx={2} fill={b.van <= value && value < b.van + 250 ? "#c8f031" : "#2f3744"} />;
      })}
      <line x1={x(stats.p50)} x2={x(stats.p50)} y1={10} y2={H} stroke="#a9b0bc" strokeDasharray="4 4" strokeWidth={2} />
      <text x={x(stats.p50)} y={H + 18} textAnchor="middle" fontSize={13} fill="#a9b0bc" fontFamily="var(--font-mono)">P50 {eur(stats.p50)}</text>
      <line x1={x(value)} x2={x(value)} y1={0} y2={H} stroke="#c8f031" strokeWidth={3} />
      <text x={x(value)} y={14} textAnchor={x(value) > W - 100 ? "end" : "start"} dx={x(value) > W - 100 ? -8 : 8} fontSize={14} fontWeight={700} fill="#c8f031">jij: {eur(value)}</text>
      <text x={x(stats.p10)} y={H + 36} textAnchor="middle" fontSize={12} fill="#7b8494" fontFamily="var(--font-mono)">P10 {eur(stats.p10)}</text>
      <text x={x(stats.p90)} y={H + 36} textAnchor="middle" fontSize={12} fill="#7b8494" fontFamily="var(--font-mono)">P90 {eur(stats.p90)}</text>
    </svg>
  );
}
