import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { db } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Recht op verwijdering (art. 17 AVG): met de verwijdersleutel uit de resultaatlink. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const key = new URL(req.url).searchParams.get("k");
  if (!key || !/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const hash = createHash("sha256").update(key).digest("hex");
  const { data, error } = await db().from("submissions").delete().eq("id", id).eq("delete_key_hash", hash).select("id");
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
