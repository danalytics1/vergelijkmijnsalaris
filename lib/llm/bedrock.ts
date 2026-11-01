import { BedrockRuntimeClient, ConverseCommand, type ContentBlock, type ImageFormat } from "@aws-sdk/client-bedrock-runtime";
import type { PageImage, PayslipExtractor } from "./types";
import { SYSTEM_PROMPT } from "./prompt";
import { extractionJsonSchema } from "./jsonSchema";

/**
 * Claude via AWS Bedrock in eu-central-1 (Frankfurt). Bedrock slaat prompts
 * en output standaard niet op en gebruikt ze niet voor training. Zorg dat
 * "Model invocation logging" in de Bedrock-console UIT staat.
 */
export class BedrockExtractor implements PayslipExtractor {
  private client = new BedrockRuntimeClient({ region: process.env.AWS_REGION ?? "eu-central-1" });
  private modelId = process.env.BEDROCK_MODEL_ID ?? "eu.anthropic.claude-sonnet-4-5-20250929-v1:0";

  async extract(pages: PageImage[]): Promise<unknown> {
    const region = process.env.AWS_REGION ?? "eu-central-1";
    if (!region.startsWith("eu-")) throw new Error("Bedrock moet in een EU-regio draaien");

    const content: ContentBlock[] = pages.map((p) => ({
      image: { format: p.mime.split("/")[1] as ImageFormat, source: { bytes: p.data } },
    }));
    content.push({ text: "Analyseer dit document volgens de instructies en roep de tool 'rapporteer_salarisstrook' aan." });

    const res = await this.client.send(
      new ConverseCommand({
        modelId: this.modelId,
        system: [{ text: SYSTEM_PROMPT }],
        messages: [{ role: "user", content }],
        inferenceConfig: { maxTokens: 2000, temperature: 0 },
        toolConfig: {
          tools: [
            {
              toolSpec: {
                name: "rapporteer_salarisstrook",
                description: "Rapporteer echtheidsoordeel en uitgelezen salarisgegevens",
                inputSchema: { json: extractionJsonSchema as never },
              },
            },
          ],
          toolChoice: { tool: { name: "rapporteer_salarisstrook" } },
        },
      }),
    );

    const block = res.output?.message?.content?.find((c) => c.toolUse);
    if (!block?.toolUse?.input) throw new Error("Geen tool-output van model");
    return block.toolUse.input;
  }
}
