export type ProviderValidation = { valid: boolean; issues: string[] };

export type AiGenerateRequest = { prompt: string; executionId: string };
export type AiGenerateResult = { output: string; artifactType: string; artifactLocation?: string };

export interface AiProvider {
  readonly name: string;
  validate(prompt: string): Promise<ProviderValidation>;
  generate(request: AiGenerateRequest): Promise<AiGenerateResult>;
  stream(request: AiGenerateRequest): AsyncIterable<string>;
}
