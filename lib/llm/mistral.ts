import type { PageImage, PayslipExtractor } from "./types";
import { SYSTEM_PROMPT } from "./prompt";
import { extractionJsonSchema } from "./jsonSchema";

/** Mistral (Frans, EU-hosting) als alternatief. Zet zero data retention aan in La Plateforme. */
export class MistralExtractor implements PayslipExtractor {
  async extract(pages: PageImage[]): Promise<unknown> {
    const key = process.env.MISTRAL_API_KEY;
    if (!key) throw new Error("MISTRAL_API_KEY ontbreekt");

    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.MISTRAL_MODEL ?? "mistral-medium-latest",
        temperature: 0,
        max_tokens: 2000,
        response_format: {
          type: "json_schema",
          json_schema: { name: "salarisstrook", schema: extractionJsonSchema, strict: true },
        },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              ...pages.map((p) => ({ type: "image_url", image_url: `data:${p.mime};base64,${p.data.toString("base64")}` })),
              { type: "text", text: "Analyseer dit document volgens de instructies." },
            ],
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Mistral-fout ${res.status}`); // body bewust niet loggen
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content;
    if (!text) throw new Error("Lege respons van Mistral");
    return JSON.parse(text);
  }
}
