import type { AiGenerateRequest, AiGenerateResult, AiProvider, BlueprintGenerateRequest, BlueprintGenerateResult } from "./types.js";

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "synthesized-feature";
}

function extensionFor(language: string): string {
  return language.toLowerCase() === "swift" ? "swift" : language.toLowerCase() === "python" ? "py" : "tsx";
}

export class MockAiProvider implements AiProvider {
  readonly name = "mock";

  constructor(private readonly explicitFallback = true) {}

  async validate(prompt: string) {
    return { valid: prompt.trim().length > 0 && !prompt.includes("[INVALID_PROMPT]"), issues: prompt.trim().length > 0 && !prompt.includes("[INVALID_PROMPT]") ? [] : ["Prompt is empty or marked invalid"] };
  }

  async generate(request: AiGenerateRequest): Promise<AiGenerateResult> {
    if (request.prompt.includes("[MOCK_PROVIDER_FAILURE]")) throw new Error("Mock provider failure requested");
    return { artifactType: "implementation-plan", artifactLocation: `mock://executions/${request.executionId}`, metadata: { name: this.name, model: "deterministic-local", fallback: this.explicitFallback, message: this.explicitFallback ? "Explicit deterministic mock fallback" : "Configured deterministic mock provider", durationMs: 4 }, output: ["# Mock Codex Result", "", "This output was produced by the local provider abstraction.", "", "## Source prompt", `The provider received ${request.prompt.length} characters.`, "", "## Proposed artifact", "- Preserve the requested architecture and constraints.", "- Keep implementation scope bounded.", "- Verify the result against the blueprint acceptance criteria."].join("\n") };
  }

  async *stream(request: AiGenerateRequest): AsyncIterable<string> {
    const result = await this.generate(request);
    yield result.output;
  }

  async generateBlueprint(request: BlueprintGenerateRequest): Promise<BlueprintGenerateResult> {
    if (!request.generatorId || !request.synthesisContext || request.synthesisContext.stackId !== request.generatorId) throw new Error("Generator selection is mandatory before mock synthesis");
    const context = request.synthesisContext;
    const targetPath = `generated/${slug(request.brief)}.${extensionFor(context.language)}`;
    const framework = context.frameworkOptions[0] ?? context.stackId;
    const message = this.explicitFallback ? "Generated from the explicit mock fallback after registry routing" : "Generated from the configured deterministic provider after registry routing";
    const blueprint = {
      name: `Synthesized ${context.domainProfile} feature`,
      description: request.brief.trim(),
      targetPath,
      language: context.language,
      framework,
      dependencies: context.frameworkOptions,
      architectureOverview: `First-principles synthesis for ${context.domainProfile} on ${context.platform}. Preserve these architectural traits: ${context.architecturalTraits.join("; ")}.`,
      coreLogic: `Derive the domain behavior from the brief while satisfying: ${context.constraints.join("; ")}.`,
      layoutDesign: `Synthesize the ${context.platform} presentation from the brief; do not import a web layout unless the classified domain requires it.`,
      constraints: context.constraints,
      source: "mock" as const,
      sourceBrief: request.brief.trim()
    };
    const proposal = {
      blueprint,
      plan: { summary: `Synthesize the ${context.domainProfile} feature from the validated brief.`, steps: ["Derive domain components from the brief and registry constraints.", "Implement the synthesized behavior within the selected platform boundary.", "Verify required components and stack constraints."], filesToTouch: [targetPath], assumptions: ["The registry constraints are architectural boundaries, not a copyable template."], acceptanceCriteria: [`The output satisfies the ${context.domainProfile} constraints.`, `The output remains within ${context.language} and ${framework}.`] },
      warnings: ["This is a deterministic synthesis surrogate. Review the generated architecture before approval."],
      provider: { name: this.name, model: "deterministic-local", fallback: this.explicitFallback, message, durationMs: 5 }
    };
    return { metadata: proposal.provider, proposal };
  }

  async health() { return { available: true, detail: "Deterministic mock is ready", model: "deterministic-local", models: { analysis: "deterministic-local", creation: "deterministic-local" } }; }
}
