-- Extra arbeidsvoorwaarden. Alle drie optioneel (null = onbekend).
--   ikb_pct                    individueel keuzebudget als % van het basissalaris (bv. Rijk 16,5, netbeheer 18)
--   bonus_pct                  gebruikelijke/verwachte bonus, winstdeling of OTE als % van het jaarlijkse basissalaris
--   pensioen_werkgever_aandeel deel van de pensioenpremie dat de werkgever betaalt, in % (70/30-regeling = 70;
--                              0 = werkgever betaalt niets, ook als er geen pensioenregeling is)
alter table public.submissions
  add column ikb_pct                    numeric(4,2) check (ikb_pct between 0 and 40),
  add column bonus_pct                  numeric(5,2) check (bonus_pct between 0 and 100),
  add column pensioen_werkgever_aandeel numeric(5,2) check (pensioen_werkgever_aandeel between 0 and 100);
