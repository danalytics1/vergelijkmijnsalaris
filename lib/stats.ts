import "server-only";
import { db } from "./supabase/server";
import { cascade, type PeerKey } from "./cascade";
import { kandidaatFuncties, rangschikFallback } from "./functieSuggesties";

export { cascade, type PeerKey };

export type PeerStats = {
  n: number; p10: number; p25: number; p50: number; p75: number; p90: number;
  pct_dertiende: number | null; pct_lease: number | null;
  avg_vakantiegeld: number | null; avg_pensioen: number | null; avg_thuiswerkdagen: number | null;
  histogram: { van: number; n: number }[];
};
export type Comparison = {
  level: string; // menselijke omschrijving van de peergroep
  key: PeerKey;
  stats: PeerStats;
  percentile: number | null; // 0..1
  stap: number; // index in de cascade (0 = meest specifiek)
  verbreed: boolean; // true als niet op het meest specifieke niveau vergeleken is
  alles: boolean; // true als vergeleken is met alle salarissen (laatste vangnet)
};

export async function compare(k: Parameters<typeof cascade>[0], value: number): Promise<Comparison | null> {
  const steps = cascade(k);
  for (const [i, step] of steps.entries()) {
    const args = {
      p_functie_key: step.key.functie_key, p_sector: step.key.sector,
      p_provincie: step.key.provincie, p_ervaringsband: step.key.ervaringsband,
    };
    const { data, error } = await db().rpc("peer_stats", { ...args, p_min_k: 10 });
    if (error) throw new Error("peer_stats faalde");
    const row = (data as PeerStats[] | null)?.[0];
    if (!row || row.n < 10) continue;
    const { data: rank } = await db().rpc("peer_rank", { ...args, p_value: value });
    return { level: step.level, key: step.key, stats: normalize(row), percentile: rank == null ? null : Number(rank),
      stap: i, verbreed: i > 0, alles: i === steps.length - 1 };
  }
  return null;
}

function normalize(r: PeerStats): PeerStats {
  const n = (x: unknown) => (x == null ? null : Number(x));
  return {
    n: Number(r.n), p10: Number(r.p10), p25: Number(r.p25), p50: Number(r.p50), p75: Number(r.p75), p90: Number(r.p90),
    pct_dertiende: n(r.pct_dertiende), pct_lease: n(r.pct_lease), avg_vakantiegeld: n(r.avg_vakantiegeld), avg_pensioen: n(r.avg_pensioen), avg_thuiswerkdagen: n(r.avg_thuiswerkdagen),
    histogram: Array.isArray(r.histogram) ? r.histogram : [],
  };
}

export type TopFunctie = {
  functie: string; functie_key: string; gedeeld: string[];
  p50: number | null; n: number | null;
  bron: "data" | "indicatie"; // data = gemeten bij mensen met jouw vaardigheden; indicatie = vaste koppeling
};

/**
 * Best betalende functies bij deze vaardigheden. Eerst uit echte inzendingen (k >= 10);
 * aangevuld met de vaste koppeling uit lib/functieSuggesties.ts zolang er te weinig data is.
 */
export async function topFunctiesVoorVaardigheden(vaardigheden: string[], eigenFunctieKey: string | null, limit = 3): Promise<TopFunctie[]> {
  if (vaardigheden.length === 0) return [];
  const { data, error } = await db().rpc("top_functies_vaardigheden", {
    p_vaardigheden: vaardigheden, p_exclude_functie_key: eigenFunctieKey, p_limit: limit, p_min_k: 10,
  });
  const uitData: TopFunctie[] = !error && Array.isArray(data)
    ? (data as { functie: string; functie_key: string; n: number; p50: number; gedeeld: string[] | null }[]).map((r) => ({
        functie: r.functie, functie_key: r.functie_key, n: Number(r.n), p50: Number(r.p50),
        gedeeld: Array.isArray(r.gedeeld) ? r.gedeeld : [], bron: "data" as const,
      }))
    : [];
  if (uitData.length >= limit) return uitData;

  const gehad = new Set(uitData.map((f) => f.functie_key));
  const kandidaten = kandidaatFuncties(vaardigheden, eigenFunctieKey).filter((k) => !gehad.has(k.functie_key));
  const medianen = new Map<string, { n: number; p50: number }>();
  if (kandidaten.length) {
    const { data: m } = await db().rpc("functie_medianen", { p_functie_keys: kandidaten.map((k) => k.functie_key), p_min_k: 10 });
    for (const r of (m ?? []) as { functie_key: string; n: number; p50: number }[]) medianen.set(r.functie_key, { n: Number(r.n), p50: Number(r.p50) });
  }
  const aanvulling = rangschikFallback(kandidaten, medianen, limit - uitData.length).map((f) => ({ ...f, bron: "indicatie" as const }));
  return [...uitData, ...aanvulling];
}
