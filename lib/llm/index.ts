import type { PayslipExtractor } from "./types";
import { BedrockExtractor } from "./bedrock";
import { MistralExtractor } from "./mistral";

/** Standaard Mistral; zet LLM_PROVIDER=bedrock voor Claude via AWS Bedrock. */
export function getExtractor(): PayslipExtractor {
  return process.env.LLM_PROVIDER === "bedrock" ? new BedrockExtractor() : new MistralExtractor();
}
export type { PageImage } from "./types";
