import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getExtractor, type PageImage } from "@/lib/llm";
import { describeLlmError } from "@/lib/llm/errors";
import { ExtractionSchema } from "@/lib/schema";
import { scrubExtraction } from "@/lib/pii/scrub";
import { verify } from "@/lib/verify/score";
import { signToken } from "@/lib/token";
import { brutoMaand, toMonthly } from "@/lib/normalize";
import { MAX_BYTES, MAX_PAGES, sniffImage } from "@/lib/images";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { db } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const preferredRegion = ["fra1"];
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Ontvangt afgeschermde afbeeldingen van een salarisstrook, laat ze door de
 * LLM analyseren en geeft vooringevulde velden + een ondertekend token terug.
 *
 * PRIVACY: het bestand blijft uitsluitend in het geheugen van deze functie.
 * Er wordt niets naar disk, Storage of logs geschreven. Log NOOIT `pages`,
 * `raw` of `extraction`.
 */
export async function POST(req: Request) {
  if (!(await rateLimit(clientIp(req.headers), "analyse", 10, 3600))) {
    return err(429, "rate_limited", "Te veel pogingen. Probeer het over een uur opnieuw.");
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return err(400, "bad_request", "Ongeldige upload.");
  }

  if (form.get("consent") !== "true") return err(400, "no_consent", "Toestemming is verplicht.");
  if (form.get("masked") !== "true") return err(400, "not_masked", "Scherm eerst je BSN en IBAN af.");

  const files = form.getAll("pages").filter((f): f is File => f instanceof File);
  if (files.length === 0 || files.length > MAX_PAGES) return err(400, "bad_pages", `Upload 1 tot ${MAX_PAGES} pagina's.`);

  const pages: PageImage[] = [];
  const hash = createHash("sha256");
  for (const f of files) {
    if (f.size > MAX_BYTES) return err(413, "too_large", "Bestand is te groot.");
    const data = Buffer.from(await f.arrayBuffer());
    const mime = sniffImage(data);
    if (!mime) return err(415, "bad_type", "Alleen afbeeldingen (na omzetten in de browser) zijn toegestaan.");
    hash.update(data);
    pages.push({ mime, data });
  }
  const fileHash = hash.digest("hex");

  let pdfMeta: { producer?: string | null; creator?: string | null } | null = null;
  try {
    const raw = form.get("pdfMeta");
    if (typeof raw === "string" && raw.length < 500) pdfMeta = JSON.parse(raw);
  } catch { /* negeren */ }

  // Dubbele upload?
  const { count } = await db().from("submissions").select("id", { count: "exact", head: true }).eq("file_hash", fileHash);
  if (count && count > 0) return err(409, "duplicate", "Deze salarisstrook is al eerder ingediend.");

  let raw: unknown;
  try {
    raw = await getExtractor().extract(pages);
  } catch (e) {
    // Alleen veilige metadata (status/code), nooit documentinhoud of modeloutput.
    console.error(`analyse: LLM-aanroep mislukt (${describeLlmError(e)})`);
    return err(502, "llm_failed", "De analyse is mislukt. Probeer het opnieuw.");
  } finally {
    // Expliciet buffers vrijgeven (best effort)
    for (const p of pages) p.data.fill(0);
    pages.length = 0;
  }

  const parsed = ExtractionSchema.safeParse(raw);
  if (!parsed.success) return err(422, "unreadable", "We konden de strook niet goed lezen. Probeer een scherpere afbeelding.");

  if (parsed.data.authenticity.visible_bsn_or_iban) {
    return err(422, "pii_visible", "Op je strook is nog een BSN of IBAN leesbaar. Scherm deze af en probeer opnieuw. Er is niets opgeslagen.");
  }

  const scrubbed = scrubExtraction(parsed.data);
  if (!scrubbed.ok) {
    return err(422, "pii_visible", "Op je strook is nog een BSN of IBAN leesbaar. Scherm deze af en probeer opnieuw. Er is niets opgeslagen.");
  }
  const ex = scrubbed.extraction;

  const result = verify(ex, pdfMeta);
  if (result.verdict === "reject") return err(422, "not_a_payslip", result.reason ?? "Dit lijkt geen echte salarisstrook.");

  const f = ex.fields;
  const bm = brutoMaand(f);
  const pensioenPct =
    f.pensioen_werknemer_periode != null && f.bruto_totaal_periode
      ? Math.round((f.pensioen_werknemer_periode / f.bruto_totaal_periode) * 1000) / 10
      : null;

  const token = signToken({
    verdict: result.verdict,
    score: result.score,
    file_hash: fileHash,
    extracted: {
      bruto_maand: bm,
      uren_per_week: f.uren_per_week,
      periode: f.periode,
      leeftijd: f.leeftijd,
      vakantiegeld_pct: f.vakantiegeld_pct,
      dertiende_maand: f.dertiende_maand,
      lease_auto: f.lease_auto,
    },
  });

  return NextResponse.json(
    {
      token,
      verified: result.verdict === "accept",
      prefill: {
        functie: f.functie,
        sector: f.sector,
        provincie: f.provincie,
        leeftijd: f.leeftijd,
        dienstjaren: f.dienstjaren,
        uren_per_week: f.uren_per_week,
        bruto_maand: bm,
        netto_maand: f.netto_periode != null ? Math.round(toMonthly(f.netto_periode, f.periode_type)) : null,
        vakantiegeld_pct: f.vakantiegeld_pct ?? 8,
        dertiende_maand: f.dertiende_maand ?? false,
        pensioen_pct: pensioenPct,
        lease_auto: f.lease_auto ?? false,
        cao: f.cao,
        periode: f.periode,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

function err(status: number, code: string, message: string) {
  return NextResponse.json({ error: code, message }, { status, headers: { "Cache-Control": "no-store" } });
}
