import type { PayslipExtractor } from "./types";
import { BedrockExtractor } from "./bedrock";
import { MistralExtractor } from "./mistral";

export function getExtractor(): PayslipExtractor {
  return process.env.LLM_PROVIDER === "mistral" ? new MistralExtractor() : new BedrockExtractor();
}
export type { PageImage } from "./types";
