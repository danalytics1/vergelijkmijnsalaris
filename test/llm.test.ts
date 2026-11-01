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
