-- Bedrijfsgrootte (aantal medewerkers) als band. Bewust GEEN werkgeversnaam.
-- Null = onbekend (seed-data, oudere inzendingen of "weet ik niet").
alter table public.submissions
  add column bedrijfsgrootte text check (bedrijfsgrootte in ('1-9','10-49','50-249','250-999','1000+'));

create index submissions_bedrijfsgrootte_idx on public.submissions (functie_key, bedrijfsgrootte) where counts_in_stats;

-- Mediaan per bedrijfsgrootte binnen een functie of sector.
-- Alleen banden met >= 10 salarissen worden teruggegeven (k-anonimiteit).
create or replace function public.bedrijfsgrootte_medianen(
  p_functie_key text, p_sector text, p_min_k int default 10
) returns table (bedrijfsgrootte text, n bigint, p50 numeric)
language sql stable security definer set search_path = public as $$
  select s.bedrijfsgrootte, count(*), round(percentile_cont(0.5) within group (order by s.bruto_maand_fte)::numeric, 0)
  from submissions s
  where s.counts_in_stats
    and s.bedrijfsgrootte is not null
    and (p_functie_key is null or s.functie_key = p_functie_key)
    and (p_sector is null or s.sector = p_sector)
    and s.periode_jaar >= extract(year from now())::int - 2
  group by s.bedrijfsgrootte
  having count(*) >= greatest(p_min_k, 10);
$$;

revoke all on function public.bedrijfsgrootte_medianen from anon, authenticated;
