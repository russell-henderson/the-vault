import type { ArchitectureSynthesisContext, BlueprintProposal, ProviderMetadata } from "@the-vault/shared";

export type ProviderValidation = { valid: boolean; issues: string[] };

export type AiGenerateRequest = { prompt: string; executionId: string };
export type AiGenerateResult = { output: string; artifactType: string; artifactLocation?: string; metadata?: ProviderMetadata };
export type BlueprintGenerateRequest = { brief: string; instruction?: string; generatorId?: string; synthesisContext?: ArchitectureSynthesisContext };
export type BlueprintGenerateResult = { proposal: BlueprintProposal; metadata: ProviderMetadata };
export type ProviderHealth = { available: boolean; detail: string; model?: string; models?: { analysis: string; creation: string } };

export interface AiProvider {
  readonly name: string;
  validate(prompt: string): Promise<ProviderValidation>;
  generate(request: AiGenerateRequest): Promise<AiGenerateResult>;
  stream(request: AiGenerateRequest): AsyncIterable<string>;
  generateBlueprint(request: BlueprintGenerateRequest): Promise<BlueprintGenerateResult>;
  health(): Promise<ProviderHealth>;
}
