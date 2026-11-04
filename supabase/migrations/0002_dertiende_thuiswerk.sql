-- 13e maand telt mee in het vergeleken salaris; thuiswerkdagen als arbeidsvoorwaarde.

-- 1. bruto_maand_fte bevat voortaan een uitgesmeerde 13e maand (× 13/12).
--    bruto_maand blijft het bedrag van de strook.
update public.submissions
   set bruto_maand_fte = round(bruto_maand_fte * 13 / 12.0, 2)
 where dertiende_maand;

-- 2. Thuiswerkdagen per week (null = onbekend, bv. bij seed-data).
alter table public.submissions
  add column thuiswerkdagen numeric(2,1) check (thuiswerkdagen between 0 and 5);

-- 3. peer_stats krijgt avg_thuiswerkdagen (returntype wijzigt, dus drop + create).
drop function public.peer_stats(text, text, text, text, int);

create function public.peer_stats(
  p_functie_key text, p_sector text, p_provincie text, p_ervaringsband text, p_min_k int default 10
) returns table (n bigint, p10 numeric, p25 numeric, p50 numeric, p75 numeric, p90 numeric,
                 pct_dertiende numeric, pct_lease numeric, avg_vakantiegeld numeric, avg_pensioen numeric,
                 avg_thuiswerkdagen numeric, histogram jsonb)
language sql stable security definer set search_path = public as $$
  with peers as (
    select * from submissions
    where counts_in_stats
      and (p_functie_key is null or functie_key = p_functie_key)
      and (p_sector is null or sector = p_sector)
      and (p_provincie is null or provincie = p_provincie)
      and (p_ervaringsband is null or ervaringsband = p_ervaringsband)
      and periode_jaar >= extract(year from now())::int - 2
  ), agg as (
    select count(*) n,
      percentile_cont(0.10) within group (order by bruto_maand_fte) p10,
      percentile_cont(0.25) within group (order by bruto_maand_fte) p25,
      percentile_cont(0.50) within group (order by bruto_maand_fte) p50,
      percentile_cont(0.75) within group (order by bruto_maand_fte) p75,
      percentile_cont(0.90) within group (order by bruto_maand_fte) p90,
      avg(case when dertiende_maand then 1.0 else 0 end) pct_dertiende,
      avg(case when lease_auto then 1.0 else 0 end) pct_lease,
      avg(vakantiegeld_pct) avg_vakantiegeld,
      avg(pensioen_pct) avg_pensioen,
      -- alleen tonen als minstens 10 peers het hebben ingevuld (k-anonimiteit)
      case when count(thuiswerkdagen) >= 10 then avg(thuiswerkdagen) end avg_thuiswerkdagen
    from peers
  ), buckets as (
    select jsonb_agg(jsonb_build_object('van', b * 250, 'n', c) order by b) h
    from (select floor(bruto_maand_fte / 250)::int b, count(*) c from peers group by 1) x
    where c >= 3
  )
  select a.n,
         round(a.p10::numeric, 0), round(a.p25::numeric, 0), round(a.p50::numeric, 0),
         round(a.p75::numeric, 0), round(a.p90::numeric, 0),
         round(a.pct_dertiende, 2), round(a.pct_lease, 2),
         round(a.avg_vakantiegeld, 2), round(a.avg_pensioen, 2),
         round(a.avg_thuiswerkdagen, 1),
         coalesce(b.h, '[]'::jsonb)
  from agg a, buckets b
  where a.n >= greatest(p_min_k, 10);
$$;

revoke all on function public.peer_stats from anon, authenticated;
