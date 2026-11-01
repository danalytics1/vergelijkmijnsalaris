/**
 * Fout van een LLM-provider met alleen veilige metadata (status, code, korte
 * foutomschrijving van de provider). Bevat NOOIT documentinhoud.
 */
export class LlmError extends Error {
  constructor(
    readonly provider: "mistral" | "bedrock",
    readonly status: number | null,
    readonly code: string,
    readonly detail?: string,
  ) {
    super(`${provider} ${status ?? "-"} ${code}`);
    this.name = "LlmError";
  }
}

const MAX_DETAIL = 300;

/** Haalt een korte, veilige omschrijving uit een foutbody van Mistral. Velden als `input` worden genegeerd: die kunnen documentinhoud bevatten. */
export function safeMistralDetail(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const b = body as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof b.message === "string") parts.push(b.message);
  else if (b.message && typeof b.message === "object" && Array.isArray((b.message as { detail?: unknown }).detail)) {
    parts.push(...detailMsgs((b.message as { detail: unknown[] }).detail));
  }
  if (Array.isArray(b.detail)) parts.push(...detailMsgs(b.detail));
  if (typeof b.type === "string") parts.push(`type=${b.type}`);
  if (typeof b.code === "string" || typeof b.code === "number") parts.push(`code=${b.code}`);
  return parts.length ? redact(parts.join(" | ")) : undefined;
}

function detailMsgs(detail: unknown[]): string[] {
  return detail.flatMap((d) => {
    if (!d || typeof d !== "object") return [];
    const { msg, loc } = d as { msg?: unknown; loc?: unknown };
    if (typeof msg !== "string") return [];
    return [Array.isArray(loc) ? `${loc.join(".")}: ${msg}` : msg];
  });
}

/** Verwijdert base64/data-URI's en lange cijferreeksen en kort in. */
function redact(s: string): string {
  return s
    .replace(/data:[^\s"']+/g, "[data]")
    .replace(/[A-Za-z0-9+/=]{60,}/g, "[blob]")
    .replace(/\d{6,}/g, "[getal]")
    .slice(0, MAX_DETAIL);
}

/** Eén logregel zonder documentinhoud, voor gebruik in console.error. */
export function describeLlmError(e: unknown): string {
  if (e instanceof LlmError) {
    return `provider=${e.provider} status=${e.status ?? "-"} code=${e.code}${e.detail ? ` detail="${e.detail}"` : ""}`;
  }
  if (e && typeof e === "object") {
    const err = e as { name?: unknown; $metadata?: { httpStatusCode?: unknown } };
    const name = typeof err.name === "string" ? err.name : "Error";
    const status = typeof err.$metadata?.httpStatusCode === "number" ? err.$metadata.httpStatusCode : "-";
    // Bewust geen e.message: kan bij parse-fouten modeloutput bevatten.
    return `name=${name} status=${status}`;
  }
  return "name=unknown";
}
