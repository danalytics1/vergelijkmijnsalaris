# DPIA — concept (te laten toetsen)

## 1. Verwerking
| Aspect | Invulling |
|---|---|
| Doel | Werkenden laten zien hoe hun salaris zich verhoudt tot dat van vergelijkbare banen; geaggregeerde salarisstatistieken |
| Grondslag | Uitdrukkelijke toestemming (art. 6.1a AVG), via een checkbox vóór het uploaden |
| Betrokkenen | Bezoekers die een salarisstrook uploaden |
| Verantwoordelijke | [bedrijf] |
| Verwerkers | AWS (Bedrock, eu-central-1), Vercel (fra1), Supabase (eu-central-1), Upstash (EU) |

## 2. Gegevensstromen
| Gegeven | Waar | Hoe lang |
|---|---|---|
| Originele PDF/afbeelding | Alleen in de browser | Tot het tabblad sluit |
| Afgeschermde afbeelding (zonder BSN/IBAN, eventueel ook zonder naam/adres) | Vercel-functie (in geheugen) → Bedrock | Duur van één request (~10-20 s). Bedrock bewaart niets |
| Uitgelezen velden (zonder PII) + HMAC-token | Browser ↔ server | Token verloopt na 1 uur |
| Geanonimiseerd salarisrecord | Supabase | Max. 3 jaar ([opschoonjob instellen]) |
| Gehasht IP (dagelijkse salt) | Upstash | 24 uur |

## 3. Risico's en maatregelen
| Risico | Kans/impact | Maatregel |
|---|---|---|
| Verwerking van BSN (art. 46 UAVG) | Middel/hoog | Afschermen verplicht; OCR-blokkade in de browser; LLM-detectie; output-scrub; geen opslag. **Restrisico:** een BSN dat door alle lagen glipt, wordt kort door Bedrock verwerkt → juridisch beoordelen |
| Naam/adres op de strook bij de LLM | Hoog/laag | Gebruiker mag ze afschermen; de LLM mag ze niet teruggeven; scrub; geen opslag |
| Herleidbaarheid via een zeldzame combinatie (functie + sector + provincie + leeftijd) | Laag/middel | Alleen banden opgeslagen; k ≥ 10 bij tonen; geen ruwe export |
| Lek van de database | Laag/laag | Geen directe PII; RLS; alleen een service role op de server |
| Prompt injection via de strook | Laag/laag | Tool-use met een strikt schema; zod-validatie; LLM-output bepaalt alleen voorinvulling en score |
| Geautomatiseerde besluitvorming (art. 22) | Laag | Een afwijzing heeft geen rechtsgevolg; je kunt het opnieuw proberen of contact opnemen |

## 4. Rechten van betrokkenen
Inzage en verwijdering via de persoonlijke resultaatlink, met een verwijdersleutel waarvan alleen de hash wordt opgeslagen. Zonder die link is een inzending niet herleidbaar tot een persoon.

## 5. Open punten
- [ ] Juridisch advies over art. 46 UAVG
- [ ] Bewaartermijn vastleggen en een opschoonjob (pg_cron) instellen
- [ ] Verwerkersovereenkomsten archiveren
