export type LlmProvider = "mistral" | "anthropic" | "bedrock";

/** Actieve provider op basis van LLM_PROVIDER (standaard mistral). */
export function llmProvider(): LlmProvider {
  const p = process.env.LLM_PROVIDER;
  return p === "anthropic" || p === "bedrock" ? p : "mistral";
}

export type LlmInfo = {
  provider: LlmProvider;
  /** Vindt de AI-analyse volledig binnen de EU plaats? */
  euOnly: boolean;
  /** Regel voor de verwerkerslijst in de privacyverklaring. */
  processor: string;
};

/**
 * Wat gebruikers over de AI-verwerking te zien krijgen. Pagina's worden bij de
 * build gerenderd, dus na het wisselen van LLM_PROVIDER opnieuw deployen.
 */
export function llmInfo(): LlmInfo {
  switch (llmProvider()) {
    case "anthropic":
      return {
        provider: "anthropic",
        euOnly: false,
        processor:
          "Anthropic (Verenigde Staten): AI-analyse. De analyse vindt plaats buiten de EU. Anthropic gebruikt je invoer niet voor training. [Bewaartermijn bij Anthropic invullen]",
      };
    case "bedrock":
      return {
        provider: "bedrock",
        euOnly: true,
        processor: "Amazon Web Services (AWS Bedrock, Frankfurt): AI-analyse. Bedrock bewaart je invoer niet en gebruikt die niet voor training.",
      };
    default:
      return {
        provider: "mistral",
        euOnly: true,
        processor:
          "Mistral AI (Frankrijk, verwerking in de EU): AI-analyse. Met zero data retention bewaart Mistral je invoer niet en gebruikt die niet voor training.",
      };
  }
}
