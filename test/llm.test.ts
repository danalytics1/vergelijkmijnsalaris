import { describe, it, expect } from "vitest";
import { describeLlmError, LlmError, safeMistralDetail } from "@/lib/llm/errors";
import { mistralSchema } from "@/lib/llm/mistral";

describe("describeLlmError", () => {
  it("toont provider, status, code en detail", () => {
    const e = new LlmError("mistral", 401, "http_error", "Unauthorized");
    expect(describeLlmError(e)).toBe('provider=mistral status=401 code=http_error detail="Unauthorized"');
  });
  it("logt van AWS-fouten alleen naam en status, geen message", () => {
    const e = Object.assign(new Error("geheime inhoud"), { name: "AccessDeniedException", $metadata: { httpStatusCode: 403 } });
    const s = describeLlmError(e);
    expect(s).toBe("name=AccessDeniedException status=403");
    expect(s).not.toContain("geheime");
  });
});

describe("safeMistralDetail", () => {
  it("neemt msg/loc over maar niet het input-veld", () => {
    const s = safeMistralDetail({
      detail: [{ loc: ["body", "response_format"], msg: "Invalid schema", input: "BSN 111222333 data:image/png;base64,AAAA" }],
    });
    expect(s).toBe("body.response_format: Invalid schema");
  });
  it("redigeert data-URI's en lange getallen", () => {
    const s = safeMistralDetail({ message: "fout bij data:image/png;base64,iVBORw0KGgo en 111222333" })!;
    expect(s).not.toContain("iVBOR");
    expect(s).not.toContain("111222333");
  });
});

describe("mistralSchema", () => {
  it("verwijdert minimum/maximum/maxItems maar houdt structuur", () => {
    const json = JSON.stringify(mistralSchema());
    expect(json).not.toMatch(/"minimum"|"maximum"|"maxItems"/);
    expect(json).toContain('"visible_bsn_or_iban"');
    expect(json).toContain('"additionalProperties":false');
  });
});

import { anthropicSchema } from "@/lib/llm/anthropic";
import { llmInfo, llmProvider } from "@/lib/llm/provider";

describe("anthropicSchema", () => {
  const s = anthropicSchema() as any;
  it("bevat geen type-arrays of numerieke grenzen meer", () => {
    const json = JSON.stringify(s);
    expect(json).not.toMatch(/"type":\[/);
    expect(json).not.toMatch(/"minimum"|"maximum"|"maxItems"/);
  });
  it("herschrijft nullable enums naar anyOf zonder null in de enum", () => {
    const sector = s.properties.fields.properties.sector;
    expect(sector.anyOf.at(-1)).toEqual({ type: "null" });
    expect(sector.anyOf[0].type).toBe("string");
    expect(sector.anyOf[0].enum).not.toContain(null);
  });
  it("houdt required en additionalProperties", () => {
    expect(s.additionalProperties).toBe(false);
    expect(s.properties.fields.required).toContain("bruto_totaal_periode");
  });
});

describe("llmProvider", () => {
  it("valt terug op mistral en kent anthropic als niet-EU", () => {
    const old = process.env.LLM_PROVIDER;
    process.env.LLM_PROVIDER = "onzin";
    expect(llmProvider()).toBe("mistral");
    expect(llmInfo().euOnly).toBe(true);
    process.env.LLM_PROVIDER = "anthropic";
    expect(llmInfo().euOnly).toBe(false);
    if (old === undefined) delete process.env.LLM_PROVIDER; else process.env.LLM_PROVIDER = old;
  });
});

import { BedrockExtractor } from "@/lib/llm/bedrock";

describe("BedrockExtractor EU-bewaking", () => {
  it("weigert een niet-EU inference profile voordat er iets verstuurd wordt", async () => {
    const old = { ...process.env };
    process.env.BEDROCK_REGION = "eu-central-1";
    process.env.BEDROCK_MODEL_ID = "us.anthropic.claude-sonnet-4-5-20250929-v1:0";
    await expect(new BedrockExtractor().extract([])).rejects.toMatchObject({ code: "non_eu_model_profile" });
    process.env.BEDROCK_REGION = "us-east-1";
    await expect(new BedrockExtractor().extract([])).rejects.toMatchObject({ code: "non_eu_region" });
    process.env = old;
  });
});
