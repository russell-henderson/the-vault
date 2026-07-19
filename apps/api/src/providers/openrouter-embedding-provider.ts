import { OpenRouter } from "@openrouter/sdk";
import type { ProviderModelOption } from "@the-vault/shared";

export const OPENROUTER_EMBEDDING_MODEL = "nvidia/llama-nemotron-embed-vl-1b-v2:free";

export type EmbeddingProbeRequest = {
  model: string;
  text: string;
  imageUrl?: string;
};

export class OpenRouterEmbeddingProvider {
  readonly name = "openrouter" as const;
  readonly apiKey: string;
  private readonly client?: OpenRouter;

  constructor(apiKey = process.env.OPENROUTER_API_KEY ?? "") {
    this.apiKey = apiKey.trim();
    if (this.apiKey) this.client = new OpenRouter({ apiKey: this.apiKey });
  }

  catalogOption(): ProviderModelOption {
    return {
      provider: "openrouter",
      model: OPENROUTER_EMBEDDING_MODEL,
      label: "Llama Nemotron Embed VL 1B (free)",
      available: Boolean(this.client),
      cloud: true,
      capability: "embedding"
    };
  }

  async embed(request: EmbeddingProbeRequest): Promise<{ model: string; dimensions: number; preview: number[]; usage?: { promptTokens?: number; totalTokens?: number } }> {
    if (!this.client) throw new Error("OpenRouter is not configured. Set OPENROUTER_API_KEY before testing an embedding model.");
    if (request.model !== OPENROUTER_EMBEDDING_MODEL) throw new Error("The selected OpenRouter embedding model is not available in the local catalog.");

    const content: Array<{ type: "text"; text: string } | { type: "image_url"; imageUrl: { url: string } }> = [{ type: "text", text: request.text }];
    if (request.imageUrl) content.push({ type: "image_url", imageUrl: { url: request.imageUrl } });

    try {
      const response = await this.client.embeddings.generate({
        requestBody: {
          model: request.model,
          input: [{ content }],
          encodingFormat: "float"
        }
      });
      if (typeof response === "string") throw new Error("OpenRouter returned an unexpected text response.");
      const embedding = response.data[0]?.embedding;
      if (!Array.isArray(embedding)) throw new Error("OpenRouter returned an invalid embedding vector.");
      return {
        model: response.model ?? request.model,
        dimensions: embedding.length,
        preview: embedding.slice(0, 5),
        usage: response.usage ? { promptTokens: response.usage.promptTokens, totalTokens: response.usage.totalTokens } : undefined
      };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("OpenRouter returned")) throw error;
      throw new Error(`OpenRouter embedding request failed: ${error instanceof Error ? error.message : "unknown provider error"}`);
    }
  }
}
