-- Best betaalde functies voor mensen met (een deel van) dezelfde vaardigheden.
-- Peers: inzendingen die minstens één van de opgegeven vaardigheden delen.
-- Per functie alleen tonen bij >= 10 peers (k-anonimiteit), gesorteerd op mediaan.
create or replace function public.top_functies_vaardigheden(
  p_vaardigheden text[], p_exclude_functie_key text default null, p_limit int default 3, p_min_k int default 10
) returns table (functie text, functie_key text, n bigint, p50 numeric, gedeeld text[])
language sql stable security definer set search_path = public as $$
  with peers as (
    select s.functie, s.functie_key, s.bruto_maand_fte, s.vaardigheden
    from submissions s
    where s.counts_in_stats
      and s.vaardigheden && p_vaardigheden
      and (p_exclude_functie_key is null or s.functie_key <> p_exclude_functie_key)
      and s.periode_jaar >= extract(year from now())::int - 2
  ), per_functie as (
    select functie_key,
           mode() within group (order by functie) functie,
           count(*) n,
           percentile_cont(0.5) within group (order by bruto_maand_fte) p50
    from peers
    group by functie_key
    having count(*) >= greatest(p_min_k, 10)
  )
  select f.functie, f.functie_key, f.n, round(f.p50::numeric, 0),
         -- welke van jouw vaardigheden komen in deze functie voor, meest voorkomend eerst
         array(
           select v from peers p, unnest(p.vaardigheden) v
           where p.functie_key = f.functie_key and v = any(p_vaardigheden)
           group by v order by count(*) desc, v
         )
  from per_functie f
  order by f.p50 desc, f.n desc
  limit least(greatest(p_limit, 1), 10);
$$;

revoke all on function public.top_functies_vaardigheden from anon, authenticated;
