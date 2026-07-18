import type { ArchitectureSynthesisContext, AuthorizedSynthesisContext, BlueprintProposal, ConstraintExtraction, DiscoveryModelResult, DiscoveryRegistryOption, ProviderMetadata } from "@the-vault/shared";

export type ProviderValidation = { valid: boolean; issues: string[] };

export type AiGenerateRequest = { prompt: string; executionId: string; signal?: AbortSignal };
export type AiGenerateResult = { output: string; artifactType: string; artifactLocation?: string; metadata?: ProviderMetadata };
export type BlueprintGenerateRequest = { brief?: string; confirmedBrief?: string; instruction?: string; generatorId?: string; synthesisContext?: ArchitectureSynthesisContext; authorizedContext?: AuthorizedSynthesisContext };
export type BlueprintGenerateResult = { proposal: BlueprintProposal; metadata: ProviderMetadata };
export type DiscoveryGenerateRequest = { brief: string; registrySlice: DiscoveryRegistryOption[]; constraints: Omit<ConstraintExtraction, "versions" | "unresolvedMentions"> & Partial<Pick<ConstraintExtraction, "versions" | "unresolvedMentions">> };
export type DiscoveryGenerateResult = { result: DiscoveryModelResult; metadata: ProviderMetadata };
export type ProviderHealth = { available: boolean; detail: string; model?: string; models?: { analysis: string; creation: string } };

export interface AiProvider {
  readonly name: string;
  readonly model?: string;
  validate(prompt: string): Promise<ProviderValidation>;
  generate(request: AiGenerateRequest): Promise<AiGenerateResult>;
  stream(request: AiGenerateRequest): AsyncIterable<string>;
  generateDiscovery(request: DiscoveryGenerateRequest): Promise<DiscoveryGenerateResult>;
  generateBlueprint(request: BlueprintGenerateRequest): Promise<BlueprintGenerateResult>;
  health(): Promise<ProviderHealth>;
}
