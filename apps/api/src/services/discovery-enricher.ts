import { enrichmentResultSchema, type EnrichmentResult, type ExplicitConstraints } from "@the-vault/shared";
import type { AiProvider } from "../providers/types.js";

export interface DiscoveryEnricher {
  readonly id: string;
  enrich(input: { brief: string; constraints: ExplicitConstraints }): Promise<EnrichmentResult>;
}

/** Local deterministic enrichment. Its IDs are observations only; the registry must authorize them. */
export class MockDiscoveryEnricher implements DiscoveryEnricher {
  readonly id = "mock-enrichment";

  async enrich(input: { brief: string; constraints: ExplicitConstraints }): Promise<EnrichmentResult> {
    const framework = input.constraints.frameworks[0];
    const suggestedGeneratorIds = framework === "spritekit" ? ["swift-spritekit"] : framework === "flet" ? ["python-flet"] : framework === "react" ? ["react-typescript"] : [];
    return enrichmentResultSchema.parse({
      domain: input.constraints.platforms[0] === "mobile" ? "mobile-physics" : input.constraints.platforms[0] === "desktop" ? "desktop-ui" : input.constraints.platforms[0] === "web" ? "web-dashboard" : null,
      suggestedGeneratorIds,
      observations: [`Local enrichment inspected ${input.brief.trim().length} characters of user intent.`],
      missingInfo: input.constraints.platforms.length === 0 ? ["Target platform"] : [],
      clarifyingQuestions: input.constraints.platforms.length === 0 ? ["Should this be a mobile, desktop, or web application?"] : [],
      unsupportedDiscoveries: input.constraints.unresolvedMentions.map((technology) => ({ technology, reason: "No local authorized policy was found for this discovery." })),
      sources: [this.id],
      warnings: []
    });
  }
}

/** Adapter for a local Ollama-backed provider. Model output remains untrusted discovery. */
export class OllamaDiscoveryEnricher implements DiscoveryEnricher {
  readonly id = "ollama-enrichment";

  constructor(private readonly provider: Pick<AiProvider, "generateDiscovery">) {}

  async enrich(input: { brief: string; constraints: ExplicitConstraints }): Promise<EnrichmentResult> {
    const result = await this.provider.generateDiscovery({ brief: input.brief, registrySlice: [], constraints: { ...input.constraints, stackMentions: [], unrecognizedMentions: input.constraints.unresolvedMentions, tokens: [] } });
    return enrichmentResultSchema.parse({
      domain: result.result.domain,
      suggestedGeneratorIds: [result.result.recommendedStackId, ...result.result.likelyStackOptions.map((option) => option.stackId)].filter((id): id is string => Boolean(id)),
      observations: result.result.likelyStackOptions.map((option) => option.reason),
      missingInfo: result.result.missingInfo,
      clarifyingQuestions: result.result.clarifyingQuestions,
      unsupportedDiscoveries: input.constraints.unresolvedMentions.map((technology) => ({ technology, reason: "The model cannot authorize an unsupported discovery." })),
      sources: [this.id],
      warnings: []
    });
  }
}
