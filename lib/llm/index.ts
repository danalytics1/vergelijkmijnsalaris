import type { PayslipExtractor } from "./types";
import { AnthropicExtractor } from "./anthropic";
import { BedrockExtractor } from "./bedrock";
import { MistralExtractor } from "./mistral";
import { llmProvider } from "./provider";

/** Kies de provider met LLM_PROVIDER: mistral (standaard) | anthropic | bedrock. */
export function getExtractor(): PayslipExtractor {
  switch (llmProvider()) {
    case "anthropic":
      return new AnthropicExtractor();
    case "bedrock":
      return new BedrockExtractor();
    default:
      return new MistralExtractor();
  }
}
export type { PageImage } from "./types";
