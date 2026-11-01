# VergelijkMijnSalaris

Salarisvergelijker in de stijl van vergelijkmijnofferte.nl. Wie wil vergelijken, moet een salarisstrook uploaden.
Mistral (EU) of Claude via AWS Bedrock (Frankfurt) leest de strook uit en controleert of hij echt is.
De gebruiker controleert daarna een vooringevuld formulier en ziet waar hij staat ten opzichte van vergelijkbare banen.

**Stack:** Next.js 15 (App Router) op Vercel `fra1` · Supabase (Frankfurt) · Mistral (EU, standaard) of AWS Bedrock `eu-central-1` · Tailwind 4.

## Flow & privacy-architectuur

```
Browser                                           Server (Vercel fra1)               Mistral (EU)
───────                                           ────────────────────               ────────────
1. PDF → pdf.js → afbeelding (PDF blijft lokaal)
   screenshot → canvas (EXIF weg)
2. Gebruiker trekt zwarte balken (verplicht)
3. Tesseract-OCR (WASM, lokaal) zoekt BSN/IBAN
   → gevonden? blokkeren.
4. Afgeschermde JPEG ───────────────────────────▶ /api/analyse (alleen in geheugen) ──▶ LLM: uitlezen + echtheid
                                                  · LLM zegt BSN/IBAN zichtbaar? → weg
                                                  · regex-scrub van output
                                                  · rekenchecks + score
                                                  · HMAC-token met uitgelezen waarden
5. Formulier (vooringevuld) ◀────────────────────
6. Indienen ─────────────────────────────────────▶ /api/submit: wijkt af van token?
                                                  → counts_in_stats = false
                                                  → Supabase: alleen geanonimiseerde velden
7. /resultaat/[id]?k=…  (k = verwijdersleutel)    peer_stats() met k ≥ 10
```

- **BSN en IBAN afschermen is verplicht** en wordt op drie niveaus gecontroleerd: OCR in de browser, het oordeel van de LLM (`visible_bsn_or_iban`) en een regex-scrub van de output.
- **Er wordt geen bestand opgeslagen.** Er is geen Supabase Storage en niets wordt naar `/tmp` geschreven. Logs bevatten geen request-bodies.
- **De DB-tabel `submissions` heeft geen kolommen voor PII.** Leeftijd en ervaring worden alleen als band opgeslagen, de datum alleen als maand en jaar.
- **k-anonimiteit:** `peer_stats()` geeft alleen iets terug als een groep minstens 10 rijen heeft. Het histogram laat banden met minder dan 3 waarnemingen weg.

## Lokaal draaien

```bash
npm install            # kopieert ook OCR/PDF-assets naar public/vendor
cp .env.example .env.local   # vul in
npm run dev
npm test               # unit tests (PII-detectie, verificatie, token, seed-import)
```

Database: voer `supabase/migrations/0001_init.sql` uit in de SQL-editor van Supabase, of gebruik `supabase db push`.

## Startdata (je eigen salarisdataset)

```bash
cp scripts/seed-mapping.example.json scripts/seed-mapping.json   # kolomnamen aanpassen
npm run seed -- data/salarissen.csv scripts/seed-mapping.json --dry-run
npm run seed -- data/salarissen.csv scripts/seed-mapping.json
```

Het script weigert een bestand met kolommen die op persoonsgegevens lijken (naam, BSN, IBAN, adres, e-mail, werkgever enz.).
Ongeldige rijen worden gerapporteerd en overgeslagen. `data/` staat in `.gitignore`.

## Checklist vóór livegang

- [ ] **Juridische toets van de BSN-verwerking (art. 46 UAVG)** en de DPIA (`docs/DPIA-concept.md`) door een privacyjurist.
- [ ] Verwerkersovereenkomsten met AWS, Vercel, Supabase en Upstash. Alle projecten in een EU-regio.
- [ ] Mistral: **zero data retention** aangevraagd en goedgekeurd in La Plateforme, `LLM_PROVIDER=mistral` en `MISTRAL_API_KEY` gezet.
- [ ] (Alleen bij `LLM_PROVIDER=anthropic`) Anthropic: `ANTHROPIC_API_KEY` gezet. Let op: verwerking buiten de EU; doorgifte juridisch laten toetsen en de bewaartermijn in de privacyverklaring invullen.
- [ ] (Alleen bij `LLM_PROVIDER=bedrock`) AWS Bedrock: **Model invocation logging UIT**, Anthropic-use-case-formulier ingevuld, IAM-user met alleen `bedrock:InvokeModel` op het `eu.`-inference-profile, access keys als `BEDROCK_ACCESS_KEY_ID`/`BEDROCK_SECRET_ACCESS_KEY` in Vercel (geen `AWS_BEARER_TOKEN_BEDROCK`).
- [ ] Vercel: function region `fra1` (staat in `vercel.json`) en de log drains beoordelen.
- [ ] `TOKEN_SECRET` minimaal 32 random tekens. Upstash Redis instellen voor rate limiting; de in-memory fallback is alleen voor dev.
- [ ] Bedrijfsgegevens invullen in `app/privacy/page.tsx`.
- [ ] Bedragen jaarlijks bijwerken in `lib/verify/loonheffing2026.ts` en `lib/verify/plausibility.ts` (minimumloon).
- [ ] Testen met 20+ echte stroken van verschillende salarispakketten (AFAS, Nmbrs, Loket, Visma, ADP) en screenshots van mobiele apps.

## Bekende beperkingen

- **Een vastberaden fraudeur komt erdoor.** De echtheidscheck vangt slordige nepstroken (rekenfouten, Word/Canva-PDF's, onlogische loonheffing). Een goed gemaakte nepstrook herkent hij niet.
- **De `masked=true`-vlag komt van de client.** Een aangepaste client kan de OCR-stap overslaan. Dan blijven de LLM-check en de scrub als vangnet over. Het BSN is in dat geval wel kort bij de LLM-provider geweest, maar wordt niet opgeslagen.
- **OCR is niet perfect,** zeker niet op wazige foto's. Daarom zijn er meerdere lagen en bevestigt de gebruiker zelf dat het BSN en IBAN onleesbaar zijn.
- **De dubbele-upload-check werkt op een hash van de afgeschermde afbeelding.** Wie anders afschermt, krijgt een nieuwe hash.
