import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import { SubmissionSchema } from "@/lib/schema";
import { verifyToken, matchesToken } from "@/lib/token";
import { functieKey, leeftijdsband, ervaringsband, fulltimeEquivalent } from "@/lib/normalize";
import { db } from "@/lib/supabase/server";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const preferredRegion = ["fra1"];
export const dynamic = "force-dynamic";

const Body = z.object({ token: z.string().max(4000), submission: SubmissionSchema });

export async function POST(req: Request) {
  if (!(await rateLimit(clientIp(req.headers), "submit", 10, 3600))) {
    return NextResponse.json({ error: "rate_limited", message: "Te veel pogingen." }, { status: 429 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid", message: "Controleer de ingevulde velden." }, { status: 400 });

  const token = verifyToken(parsed.data.token);
  if (!token) {
    return NextResponse.json({ error: "token_invalid", message: "Je sessie is verlopen. Upload je strook opnieuw." }, { status: 401 });
  }

  const s = parsed.data.submission;
  const match = matchesToken(token, s);
  // Alleen geverifieerde stroken die niet (sterk) zijn aangepast tellen mee.
  const counts = token.verdict === "accept" && match.matches;

  const deleteKey = randomBytes(18).toString("base64url");
  const row = {
    delete_key_hash: createHash("sha256").update(deleteKey).digest("hex"),
    source: "upload",
    counts_in_stats: counts,
    auth_score: token.score,
    file_hash: token.file_hash,
    functie: s.functie.trim(),
    functie_key: functieKey(s.functie),
    seniority: s.senioriteit,
    sector: s.sector,
    provincie: s.provincie,
    leeftijdsband: leeftijdsband(s.leeftijd),
    ervaringsband: ervaringsband(s.dienstjaren),
    opleidingsniveau: s.opleidingsniveau,
    bedrijfsgrootte: s.bedrijfsgrootte === "onbekend" ? null : s.bedrijfsgrootte,
    uren_per_week: s.uren_per_week,
    bruto_maand: s.bruto_maand,
    bruto_maand_fte: fulltimeEquivalent(s.bruto_maand, s.uren_per_week, s.dertiende_maand),
    vakantiegeld_pct: s.vakantiegeld_pct,
    dertiende_maand: s.dertiende_maand,
    thuiswerkdagen: s.thuiswerkdagen,
    werkplezier: s.werkplezier,
    vaardigheden: s.vaardigheden,
    pensioen_pct: s.pensioen_pct,
    lease_auto: s.lease_auto,
    cao: s.cao,
    periode_jaar: Number(s.periode.slice(0, 4)),
  };

  const { data, error } = await db().from("submissions").insert(row).select("id").single();
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "duplicate", message: "Deze strook is al ingediend." }, { status: 409 });
    console.error("submit: insert mislukt", error.code);
    return NextResponse.json({ error: "db", message: "Opslaan mislukt." }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, deleteKey, counts_in_stats: counts, deviations: match.deviations });
}
