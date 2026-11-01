import { NextResponse } from "next/server";
import { db } from "@/lib/supabase/server";
import { functieKey } from "@/lib/normalize";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const q = functieKey(new URL(req.url).searchParams.get("q") ?? "");
  if (q.length < 2) return NextResponse.json([]);
  const { data } = await db().rpc("functie_suggesties", { p_q: q.slice(0, 50) });
  return NextResponse.json((data ?? []).map((r: { functie: string }) => r.functie), {
    headers: { "Cache-Control": "public, s-maxage=3600" },
  });
}
