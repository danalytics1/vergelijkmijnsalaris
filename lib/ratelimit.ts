import "server-only";
import { createHash } from "node:crypto";

/**
 * Rate limiting zonder IP-adressen op te slaan: we hashen IP + dagelijkse
 * salt (afgeleid van TOKEN_SECRET + datum). De hash is na 24 uur niet meer
 * te herleiden en verloopt in Redis na 24 uur.
 */
function key(ip: string, bucket: string) {
  const day = new Date().toISOString().slice(0, 10);
  return `rl:${bucket}:${createHash("sha256").update(`${process.env.TOKEN_SECRET}|${day}|${ip}`).digest("hex").slice(0, 32)}`;
}

const memory = new Map<string, { count: number; reset: number }>();

export async function rateLimit(ip: string, bucket: string, limit: number, windowSec: number): Promise<boolean> {
  const k = key(ip, bucket);
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify([["INCR", k], ["EXPIRE", k, String(windowSec), "NX"]]),
    });
    if (!res.ok) return true; // fail-open: liever bereikbaar dan geblokkeerd
    const results = (await res.json()) as { result: number }[];
    return (results[0]?.result ?? 0) <= limit;
  }

  // Fallback per serverless-instantie (alleen geschikt voor dev)
  const now = Date.now();
  const e = memory.get(k);
  if (!e || e.reset < now) {
    memory.set(k, { count: 1, reset: now + windowSec * 1000 });
    return true;
  }
  e.count++;
  return e.count <= limit;
}

export function clientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
