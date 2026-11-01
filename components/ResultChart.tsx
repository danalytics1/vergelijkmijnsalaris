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
      <rect x={x(stats.p25)} y={0} width={x(stats.p75) - x(stats.p25)} height={H} fill="#eef6ff" />
      {bars.map((b) => {
        const h = (b.n / maxN) * (H - 30);
        return <rect key={b.van} x={x(b.van) + 1} y={H - h} width={bw} height={h} rx={2} fill="#93c5fd" />;
      })}
      <line x1={x(stats.p50)} x2={x(stats.p50)} y1={10} y2={H} stroke="#1149a8" strokeDasharray="4 4" strokeWidth={2} />
      <text x={x(stats.p50)} y={H + 18} textAnchor="middle" fontSize={13} fill="#1149a8">mediaan {eur(stats.p50)}</text>
      <line x1={x(value)} x2={x(value)} y1={0} y2={H} stroke="#16a34a" strokeWidth={4} />
      <text x={x(value)} y={14} textAnchor={x(value) > W - 100 ? "end" : "start"} dx={x(value) > W - 100 ? -8 : 8} fontSize={14} fontWeight={700} fill="#12873d">jij: {eur(value)}</text>
      <text x={x(stats.p10)} y={H + 36} textAnchor="middle" fontSize={12} fill="#64748b">P10 {eur(stats.p10)}</text>
      <text x={x(stats.p90)} y={H + 36} textAnchor="middle" fontSize={12} fill="#64748b">P90 {eur(stats.p90)}</text>
    </svg>
  );
}
