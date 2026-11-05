-- Extra vragen na upload: werkplezier, senioriteit (zelf opgegeven) en top-3 vaardigheden.

-- 1. Senioriteit: bestaande kolom wordt voortaan door de gebruiker gekozen
--    (seed-data blijft afgeleid van de functietitel). Twee niveaus erbij.
alter table public.submissions drop constraint if exists submissions_seniority_check;
alter table public.submissions
  add constraint submissions_seniority_check
  check (seniority in ('junior','medior','senior','lead','manager'));

-- 2. Werkplezier 1 (helemaal niet) – 5 (heel veel). Null = onbekend (seed).
alter table public.submissions
  add column werkplezier smallint check (werkplezier between 1 and 5);

-- 3. Maximaal drie vaardigheden/kwalificaties uit een vaste lijst (lib/vaardigheden.ts).
--    De lijst zelf wordt in de applicatie gevalideerd; de database bewaakt het aantal.
alter table public.submissions
  add column vaardigheden text[] check (cardinality(vaardigheden) between 1 and 3);

create index submissions_vaardigheden_idx on public.submissions using gin (vaardigheden);
