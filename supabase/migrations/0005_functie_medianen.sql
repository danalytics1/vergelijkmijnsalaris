-- Mediaan per functie (alle sectoren/provincies), alleen bij >= 10 salarissen.
-- Gebruikt door de fallback van "best betaalde functies bij jouw vaardigheden".
create or replace function public.functie_medianen(p_functie_keys text[], p_min_k int default 10)
returns table (functie_key text, n bigint, p50 numeric)
language sql stable security definer set search_path = public as $$
  select s.functie_key, count(*), round(percentile_cont(0.5) within group (order by s.bruto_maand_fte)::numeric, 0)
  from submissions s
  where s.counts_in_stats
    and s.functie_key = any(p_functie_keys)
    and s.periode_jaar >= extract(year from now())::int - 2
  group by s.functie_key
  having count(*) >= greatest(p_min_k, 10);
$$;

revoke all on function public.functie_medianen from anon, authenticated;
