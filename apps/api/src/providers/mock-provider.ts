import type { AuthorizedSynthesisContext, ArchitectureSynthesisContext } from "@the-vault/shared";
import type { AiGenerateRequest, AiGenerateResult, AiProvider, BlueprintGenerateRequest, BlueprintGenerateResult, DiscoveryGenerateRequest, DiscoveryGenerateResult } from "./types.js";

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "synthesized-feature";
}

function extensionFor(language: string): string {
  return language.toLowerCase() === "swift" ? "swift" : language.toLowerCase() === "python" ? "py" : "tsx";
}

function contextFromAuthorization(authorization: AuthorizedSynthesisContext): ArchitectureSynthesisContext {
  if (authorization.policyHash !== authorization.generatorPolicy.policyHash || authorization.provenance.policyHash !== authorization.policyHash || authorization.provenance.validationStatus !== "passed") throw new Error("Authorized synthesis context failed provenance validation");
  return {
    stackId: authorization.generatorPolicy.id,
    domainProfile: authorization.generatorPolicy.id === "swift-spritekit" ? "mobile-physics" : authorization.generatorPolicy.id === "python-flet" ? "desktop-ui" : "web-dashboard",
    platform: authorization.generatorPolicy.implementation.platform as "mobile" | "desktop" | "web",
    language: authorization.generatorPolicy.implementation.language,
    frameworkOptions: authorization.generatorPolicy.implementation.frameworks,
    requiredComponentKinds: authorization.generatorPolicy.implementation.capabilities,
    architecturalTraits: authorization.generatorPolicy.implementation.capabilityFingerprint,
    constraints: authorization.generatorPolicy.constraints.requires,
    prohibitedSubstitutions: authorization.generatorPolicy.constraints.conflicts
  };
}

export class MockAiProvider implements AiProvider {
  readonly name = "mock";
  readonly model = "deterministic-local";

  constructor(private readonly explicitFallback = true) {}

  async validate(prompt: string) {
    return { valid: prompt.trim().length > 0 && !prompt.includes("[INVALID_PROMPT]"), issues: prompt.trim().length > 0 && !prompt.includes("[INVALID_PROMPT]") ? [] : ["Prompt is empty or marked invalid"] };
  }

  async generate(request: AiGenerateRequest): Promise<AiGenerateResult> {
    if (request.prompt.includes("[MOCK_PROVIDER_FAILURE]")) throw new Error("Mock provider failure requested");
    if (request.prompt.includes("You are a structured project architect.")) {
      return {
        artifactType: "json",
        artifactLocation: `mock://extrapolate/${request.executionId}`,
        metadata: { name: this.name, model: "deterministic-local", fallback: this.explicitFallback, message: "Mock extrapolation", durationMs: 4 },
        output: JSON.stringify({
          projectName: "Mocked Saas App",
          architectureOverview: "A cloud-native SaaS application for user management and reporting.",
          coreLogic: "Targeted at enterprise customers requiring robust access controls and real-time visualization dashboards.",
          dependencies: ["fastify", "better-sqlite3", "zod"],
          technicalConstraints: ["Must run locally on Node v22", "Must use SQLite for storage"],
          comments: ["Support offline mode", "Ensure fast load times"],
          preview: "# Mocked Saas App\n\nThis is an executive summary of the mocked project. It features user access control and interactive analytics panels."
        })
      };
    }
    return { artifactType: "implementation-plan", artifactLocation: `mock://executions/${request.executionId}`, metadata: { name: this.name, model: "deterministic-local", fallback: this.explicitFallback, message: this.explicitFallback ? "Explicit deterministic mock fallback" : "Configured deterministic mock provider", durationMs: 4 }, output: ["# Mock Codex Result", "", "This output was produced by the local provider abstraction.", "", "## Source prompt", `The provider received ${request.prompt.length} characters.`, "", "## Proposed artifact", "- Preserve the requested architecture and constraints.", "- Keep implementation scope bounded.", "- Verify the result against the blueprint acceptance criteria."].join("\n") };
  }

  async *stream(request: AiGenerateRequest): AsyncIterable<string> {
    const result = await this.generate(request);
    const chunkSize = 72;
    for (let index = 0; index < result.output.length; index += chunkSize) {
      if (request.signal?.aborted) throw new Error("Generation cancelled by client");
      yield result.output.slice(index, index + chunkSize);
    }
  }

  async generateDiscovery(request: DiscoveryGenerateRequest): Promise<DiscoveryGenerateResult> {
    const started = Date.now();
    const options = request.registrySlice.slice(0, 3).map((option, index) => ({
      stackId: option.stackId,
      reason: `${option.language} with ${option.frameworkOptions.join(" / ")} fits the ${option.domainProfile} domain and its stated intent signals.`,
      confidence: Math.max(0.55, 0.9 - index * 0.08)
    }));
    const top = request.registrySlice[0];
    return {
      result: {
        domain: top?.domainProfile ?? null,
        likelyStackOptions: options,
        recommendedStackId: top?.stackId ?? null,
        missingInfo: [],
        clarifyingQuestions: []
      },
      metadata: { name: this.name, model: "deterministic-local", fallback: this.explicitFallback, message: "Deterministic registry discovery", durationMs: Date.now() - started }
    };
  }

  async generateBlueprint(request: BlueprintGenerateRequest): Promise<BlueprintGenerateResult> {
    const brief = request.confirmedBrief ?? request.brief;
    const context = request.authorizedContext ? contextFromAuthorization(request.authorizedContext) : request.synthesisContext;
    const generatorId = request.authorizedContext?.generatorPolicy.id ?? request.generatorId;
    if (!brief || !generatorId || !context || context.stackId !== generatorId) throw new Error("Generator selection is mandatory before mock synthesis");
    const targetPath = `generated/${slug(brief)}.${extensionFor(context.language)}`;
    const framework = context.frameworkOptions[0] ?? context.stackId;
    const message = this.explicitFallback ? "Generated from the explicit mock fallback after registry routing" : "Generated from the configured deterministic provider after registry routing";
    const blueprint = {
      name: `Synthesized ${context.domainProfile} feature`,
      description: brief.trim(),
      targetPath,
      language: context.language,
      framework,
      dependencies: context.frameworkOptions,
      architectureOverview: `First-principles synthesis for ${context.domainProfile} on ${context.platform}. Preserve these architectural traits: ${context.architecturalTraits.join("; ")}.`,
      coreLogic: `Derive the domain behavior from the brief while satisfying: ${context.constraints.join("; ")}.`,
      layoutDesign: `Synthesize the ${context.platform} presentation from the brief; do not import a web layout unless the classified domain requires it.`,
      constraints: context.constraints,
      tags: [],
      source: "mock" as const,
      sourceBrief: brief.trim()
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
