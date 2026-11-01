import Anthropic from "@anthropic-ai/sdk";
import type { PageImage, PayslipExtractor } from "./types";
import { SYSTEM_PROMPT } from "./prompt";
import { extractionJsonSchema } from "./jsonSchema";
import { LlmError } from "./errors";

const DEFAULT_MODEL = "claude-opus-5-5";

/**
 * Claude via de Anthropic API (direct, met ANTHROPIC_API_KEY).
 *
 * LET OP: de Anthropic API verwerkt niet uitsluitend in de EU. De teksten op
 * de site passen zich aan via lib/llm/provider.ts.
 *
 * Gestructureerde output via output_config.format (json_schema), zodat het
 * antwoord gegarandeerd aan het schema voldoet. Zod valideert daarna in de route.
 */
export class AnthropicExtractor implements PayslipExtractor {
  async extract(pages: PageImage[]): Promise<unknown> {
    if (!process.env.ANTHROPIC_API_KEY) throw new LlmError("anthropic", null, "missing_api_key");

    // timeout/retries binnen maxDuration (60 s) van de route
    const client = new Anthropic({ timeout: 50_000, maxRetries: 1 });

    let res: Anthropic.Beta.BetaMessage;
    try {
      res = await client.beta.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        output_config: { effort: "medium", format: { type: "json_schema", schema: anthropicSchema() } },
        // Bij een (onterechte) weigering door veiligheidsfilters automatisch opnieuw op een ander model.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        messages: [
          {
            role: "user",
            content: [
              ...pages.map((p) => ({
                type: "image" as const,
                source: { type: "base64" as const, media_type: p.mime, data: p.data.toString("base64") },
              })),
              { type: "text" as const, text: "Analyseer dit document volgens de instructies en antwoord met het JSON-object." },
            ],
          },
        ],
      });
    } catch (e) {
      if (e instanceof Anthropic.APIConnectionTimeoutError) throw new LlmError("anthropic", null, "timeout");
      if (e instanceof Anthropic.APIConnectionError) throw new LlmError("anthropic", null, "network");
      if (e instanceof Anthropic.APIError) {
        const type = (e.error as { error?: { type?: unknown } } | undefined)?.error?.type;
        throw new LlmError("anthropic", e.status ?? null, "http_error", typeof type === "string" ? `type=${type}` : undefined);
      }
      throw e;
    }

    if (res.stop_reason === "refusal") throw new LlmError("anthropic", 200, "refusal");
    if (res.stop_reason === "max_tokens") throw new LlmError("anthropic", 200, "max_tokens");

    const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    if (!text) throw new LlmError("anthropic", 200, "empty_response", `stop_reason=${res.stop_reason ?? "-"}`);
    try {
      return JSON.parse(text);
    } catch {
      throw new LlmError("anthropic", 200, "invalid_json");
    }
  }
}

/**
 * Schema voor structured outputs: zonder numerieke/array-grenzen (niet
 * ondersteund) en met `type: [x, "null"]` herschreven naar `anyOf`.
 */
export function anthropicSchema(): Record<string, unknown> {
  const DROP = new Set(["minimum", "maximum", "maxItems"]);
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (!v || typeof v !== "object") return v;
    const o = Object.fromEntries(
      Object.entries(v as Record<string, unknown>).filter(([k]) => !DROP.has(k)).map(([k, x]) => [k, k === "enum" ? x : walk(x)]),
    ) as Record<string, unknown>;
    if (Array.isArray(o.type)) {
      const { type, enum: en, description, ...rest } = o;
      const types = (type as string[]).filter((t) => t !== "null");
      const values = Array.isArray(en) ? en.filter((x) => x !== null) : undefined;
      const variants = types.map((t) => ({ type: t, ...(values ? { enum: values } : {}), ...rest }));
      return { ...(description ? { description } : {}), anyOf: [...variants, { type: "null" }] };
    }
    return o;
  };
  return walk(extractionJsonSchema) as Record<string, unknown>;
}
