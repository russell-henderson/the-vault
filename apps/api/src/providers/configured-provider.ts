import type { AiProvider } from "./types.js";
import { MockAiProvider } from "./mock-provider.js";
import { OllamaAiProvider } from "./ollama-provider.js";

export function createConfiguredProvider(): AiProvider {
  return process.env.AI_PROVIDER === "ollama" ? new OllamaAiProvider() : new MockAiProvider(false);
}
