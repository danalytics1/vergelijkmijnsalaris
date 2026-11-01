import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ContentBlock,
  type ImageFormat,
  type ToolChoice,
} from "@aws-sdk/client-bedrock-runtime";
import type { PageImage, PayslipExtractor } from "./types";
import { SYSTEM_PROMPT } from "./prompt";
import { extractionJsonSchema } from "./jsonSchema";
import { LlmError } from "./errors";

const DEFAULT_MODEL = "eu.anthropic.claude-sonnet-4-5-20250929-v1:0";
const TOOL = "rapporteer_salarisstrook";

/**
 * Claude via AWS Bedrock in een EU-regio. Bedrock slaat prompts en output
 * standaard niet op en gebruikt ze niet voor training. Zorg dat "Model
 * invocation logging" in de Bedrock-console UIT staat.
 *
 * Authenticatie met IAM-access-keys (SigV4). Vercel reserveert de namen
 * AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY/AWS_REGION, dus gebruik daar
 * BEDROCK_ACCESS_KEY_ID, BEDROCK_SECRET_ACCESS_KEY en BEDROCK_REGION. Een
 * Bedrock API key (bearer token) wordt bewust niet gebruikt: die is in onze
 * AWS-organisatie per SCP geblokkeerd.
 */
export class BedrockExtractor implements PayslipExtractor {
  async extract(pages: PageImage[]): Promise<unknown> {
    const region = process.env.BEDROCK_REGION ?? process.env.AWS_REGION ?? "eu-central-1";
    if (!region.startsWith("eu-")) throw new LlmError("bedrock", null, "non_eu_region");

    const accessKeyId = process.env.BEDROCK_ACCESS_KEY_ID;
    const secretAccessKey = process.env.BEDROCK_SECRET_ACCESS_KEY;
    const client = new BedrockRuntimeClient({
      region,
      // Altijd SigV4, ook als AWS_BEARER_TOKEN_BEDROCK nog ergens gezet is.
      authSchemePreference: ["sigv4"],
      ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
    });
    const modelId = process.env.BEDROCK_MODEL_ID ?? DEFAULT_MODEL;
    if (!/^(eu\.|arn:aws:bedrock:eu-)/.test(modelId)) {
      // Alleen EU-inference-profiles: een "us."/"global."-profiel kan buiten de EU draaien.
      throw new LlmError("bedrock", null, "non_eu_model_profile");
    }

    const content: ContentBlock[] = pages.map((p) => ({
      image: { format: p.mime.split("/")[1] as ImageFormat, source: { bytes: p.data } },
    }));
    content.push({ text: `Analyseer dit document volgens de instructies en roep de tool '${TOOL}' aan.` });

    const send = (toolChoice: ToolChoice) =>
      client.send(
        new ConverseCommand({
          modelId,
          system: [{ text: SYSTEM_PROMPT }],
          messages: [{ role: "user", content }],
          inferenceConfig: { maxTokens: 4000 },
          toolConfig: {
            tools: [
              {
                toolSpec: {
                  name: TOOL,
                  description: "Rapporteer echtheidsoordeel en uitgelezen salarisgegevens",
                  inputSchema: { json: extractionJsonSchema as never },
                },
              },
            ],
            toolChoice,
          },
        }),
      );

    let res;
    try {
      res = await send({ tool: { name: TOOL } });
    } catch (e) {
      // Nieuwere Claude-modellen weigeren geforceerde tool-keuze; dan 'auto' met instructie.
      if ((e as { name?: string }).name !== "ValidationException") throw e;
      console.warn("analyse: Bedrock weigerde geforceerde tool-keuze, opnieuw met auto");
      res = await send({ auto: {} });
    }

    const block = res.output?.message?.content?.find((c) => c.toolUse);
    if (!block?.toolUse?.input) {
      throw new LlmError("bedrock", 200, "no_tool_output", `stopReason=${res.stopReason ?? "-"}`);
    }
    return block.toolUse.input;
  }
}
