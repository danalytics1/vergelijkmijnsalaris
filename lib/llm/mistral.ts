import type { PageImage, PayslipExtractor } from "./types";
import { SYSTEM_PROMPT } from "./prompt";
import { extractionJsonSchema } from "./jsonSchema";
import { LlmError, safeMistralDetail } from "./errors";

const ENDPOINT = "https://api.mistral.ai/v1/chat/completions";
const TIMEOUT_MS = 50_000; // binnen maxDuration (60 s) van de route

/**
 * Mistral (Frans, EU-hosting). Zet zero data retention aan in La Plateforme.
 *
 * Eerst met strikte JSON-schema-output. Weigert Mistral het schema (400/422),
 * dan één nieuwe poging met gewone JSON-modus en het schema in de prompt. De
 * output wordt in de route hoe dan ook met zod gevalideerd.
 */
export class MistralExtractor implements PayslipExtractor {
  async extract(pages: PageImage[]): Promise<unknown> {
    const key = process.env.MISTRAL_API_KEY;
    if (!key) throw new LlmError("mistral", null, "missing_api_key");
    const model = process.env.MISTRAL_MODEL ?? "mistral-medium-latest";

    const images = pages.map((p) => ({
      type: "image_url",
      image_url: `data:${p.mime};base64,${p.data.toString("base64")}`,
    }));

    try {
      return await this.call(key, {
        model,
        response_format: {
          type: "json_schema",
          json_schema: { name: "salarisstrook", schema: mistralSchema(), strict: true },
        },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: [...images, { type: "text", text: "Analyseer dit document volgens de instructies." }] },
        ],
      });
    } catch (e) {
      if (!(e instanceof LlmError) || (e.status !== 400 && e.status !== 422)) throw e;
      console.warn(`analyse: Mistral weigerde json_schema (${e.status}), opnieuw met json_object`);
    }

    return this.call(key, {
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}\n\nANTWOORD: uitsluitend één JSON-object dat exact voldoet aan dit JSON Schema, zonder uitleg of markdown:\n${JSON.stringify(mistralSchema())}`,
        },
        { role: "user", content: [...images, { type: "text", text: "Analyseer dit document volgens de instructies en antwoord met het JSON-object." }] },
      ],
    });
  }

  private async call(key: string, body: Record<string, unknown>): Promise<unknown> {
    let res: Response;
    try {
      res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ temperature: 0, max_tokens: 2000, ...body }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (e) {
      const name = e instanceof Error ? e.name : "unknown";
      throw new LlmError("mistral", null, name === "TimeoutError" ? "timeout" : `network_${name}`);
    }

    if (!res.ok) {
      let detail: string | undefined;
      try {
        detail = safeMistralDetail(await res.json());
      } catch { /* geen JSON */ }
      throw new LlmError("mistral", res.status, "http_error", detail);
    }

    const json = (await res.json()) as { choices?: { message?: { content?: unknown }; finish_reason?: string }[] };
    const choice = json.choices?.[0];
    const text = typeof choice?.message?.content === "string" ? choice.message.content : null;
    if (!text) throw new LlmError("mistral", res.status, "empty_response", `finish_reason=${choice?.finish_reason ?? "-"}`);

    try {
      return JSON.parse(stripFences(text));
    } catch {
      throw new LlmError("mistral", res.status, "invalid_json", `finish_reason=${choice?.finish_reason ?? "-"}`);
    }
  }
}

function stripFences(s: string): string {
  const m = s.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return m ? m[1] : s;
}

/**
 * Schema zonder validatie-keywords (minimum, maximum, maxItems) die niet elke
 * structured-output-implementatie ondersteunt. Zod controleert die grenzen.
 */
export function mistralSchema(): unknown {
  const DROP = new Set(["minimum", "maximum", "maxItems"]);
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      return Object.fromEntries(Object.entries(v).filter(([k]) => !DROP.has(k)).map(([k, x]) => [k, walk(x)]));
    }
    return v;
  };
  return walk(extractionJsonSchema);
}
