-- vergelijkmijnsalaris — basisschema
-- Bewust GEEN kolommen voor naam, adres, postcode, BSN, IBAN, werkgever,
-- geboortedatum, IP-adres of e-mail. Zie docs/DPIA-concept.md.

create extension if not exists pgcrypto;

create table public.submissions (
  id                uuid primary key default gen_random_uuid(),
  delete_key_hash   text,                         -- sha256 van de verwijdersleutel (alleen bij uploads)
  created_month     date not null default date_trunc('month', now())::date,
  source            text not null check (source in ('seed', 'upload')),
  counts_in_stats   boolean not null default true,
  auth_score        numeric(3,2),
  file_hash         text unique,                  -- sha256 van de (afgeschermde) afbeelding, tegen dubbele uploads

  functie           text not null,
  functie_key       text not null,
  seniority         text check (seniority in ('junior','medior','senior')),
  sector            text not null,
  provincie         text,
  leeftijdsband     text not null,
  ervaringsband     text not null,
  opleidingsniveau  text not null default 'onbekend',

  uren_per_week     numeric(4,1) not null check (uren_per_week between 1 and 60),
  bruto_maand       numeric(10,2) not null check (bruto_maand between 500 and 100000),
  bruto_maand_fte   numeric(10,2) not null,       -- herleid naar 40 uur
  vakantiegeld_pct  numeric(4,2),
  dertiende_maand   boolean,
  pensioen_pct      numeric(4,2),
  lease_auto        boolean,
  cao               text,
  periode_jaar      smallint not null
);

create index submissions_peer_idx on public.submissions (functie_key, sector, provincie, ervaringsband) where counts_in_stats;
create index submissions_sector_idx on public.submissions (sector) where counts_in_stats;

-- Geen directe toegang voor anon/authenticated: alles via server (service role).
alter table public.submissions enable row level security;
revoke all on public.submissions from anon, authenticated;

-- Aggregatie met afgedwongen k-anonimiteit (k >= 10).
create or replace function public.peer_stats(
  p_functie_key text, p_sector text, p_provincie text, p_ervaringsband text, p_min_k int default 10
) returns table (n bigint, p10 numeric, p25 numeric, p50 numeric, p75 numeric, p90 numeric,
                 pct_dertiende numeric, pct_lease numeric, avg_vakantiegeld numeric, avg_pensioen numeric,
                 histogram jsonb)
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
      avg(pensioen_pct) avg_pensioen
    from peers
  ), buckets as (
    -- histogram in banden van €250; banden met < 3 waarnemingen worden samengevoegd weggelaten
    select jsonb_agg(jsonb_build_object('van', b * 250, 'n', c) order by b) h
    from (select floor(bruto_maand_fte / 250)::int b, count(*) c from peers group by 1) x
    where c >= 3
  )
  select a.n,
         round(a.p10::numeric, 0), round(a.p25::numeric, 0), round(a.p50::numeric, 0),
         round(a.p75::numeric, 0), round(a.p90::numeric, 0),
         round(a.pct_dertiende, 2), round(a.pct_lease, 2),
         round(a.avg_vakantiegeld, 2), round(a.avg_pensioen, 2),
         coalesce(b.h, '[]'::jsonb)
  from agg a, buckets b
  where a.n >= greatest(p_min_k, 10);
$$;

-- Percentiel van één waarde binnen dezelfde peergroep (alleen als k >= 10).
create or replace function public.peer_rank(
  p_functie_key text, p_sector text, p_provincie text, p_ervaringsband text, p_value numeric
) returns numeric
language sql stable security definer set search_path = public as $$
  select case when count(*) >= 10
    then round(avg(case when bruto_maand_fte < p_value then 1.0 when bruto_maand_fte = p_value then 0.5 else 0 end), 3)
  end
  from submissions
  where counts_in_stats
    and (p_functie_key is null or functie_key = p_functie_key)
    and (p_sector is null or sector = p_sector)
    and (p_provincie is null or provincie = p_provincie)
    and (p_ervaringsband is null or ervaringsband = p_ervaringsband)
    and periode_jaar >= extract(year from now())::int - 2;
$$;

-- Autocomplete voor functietitels: alleen titels die >= 5 keer voorkomen
create or replace function public.functie_suggesties(p_q text)
returns table (functie text, n bigint)
language sql stable security definer set search_path = public as $$
  select min(functie), count(*) from submissions
  where functie_key like '%' || lower(p_q) || '%'
  group by functie_key having count(*) >= 5
  order by count(*) desc limit 10;
$$;

revoke all on function public.peer_stats, public.peer_rank, public.functie_suggesties from anon, authenticated;
