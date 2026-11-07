-- P25/P50/P75 per senioriteit binnen een functie (optioneel binnen een sector).
-- Voedt de grafiek "salarisgroei per senioriteit" op de resultaatpagina.
-- Alleen niveaus met >= 10 salarissen worden teruggegeven (k-anonimiteit).
create or replace function public.senioriteit_percentielen(
  p_functie_key text, p_sector text, p_min_k int default 10
) returns table (seniority text, n bigint, p25 numeric, p50 numeric, p75 numeric)
language sql stable security definer set search_path = public as $$
  select s.seniority, count(*),
    round(percentile_cont(0.25) within group (order by s.bruto_maand_fte)::numeric, 0),
    round(percentile_cont(0.50) within group (order by s.bruto_maand_fte)::numeric, 0),
    round(percentile_cont(0.75) within group (order by s.bruto_maand_fte)::numeric, 0)
  from submissions s
  where s.counts_in_stats
    and s.seniority is not null
    and s.functie_key = p_functie_key
    and (p_sector is null or s.sector = p_sector)
    and s.periode_jaar >= extract(year from now())::int - 2
  group by s.seniority
  having count(*) >= greatest(p_min_k, 10);
$$;

revoke all on function public.senioriteit_percentielen from anon, authenticated;
