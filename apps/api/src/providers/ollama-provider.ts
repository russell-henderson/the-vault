import { blueprintProposalSchema, discoveryModelResultSchema, providerCatalogSchema, type ArchitectureSynthesisContext, type AuthorizedSynthesisContext, type ProviderCatalog, type ProviderModelOption, type ProviderSelection } from "@the-vault/shared";
import type { AiGenerateRequest, AiGenerateResult, AiProvider, BlueprintGenerateRequest, BlueprintGenerateResult, DiscoveryGenerateRequest, DiscoveryGenerateResult } from "./types.js";

type OllamaResponse = { response?: string; error?: string };
type OllamaTagsResponse = { models?: Array<{ name?: string }> };
type StrictBlueprintGenerateRequest = BlueprintGenerateRequest & { brief: string; generatorId: string; synthesisContext: NonNullable<BlueprintGenerateRequest["synthesisContext"]> };

export function isCloudModel(model: string): boolean {
  return model.toLowerCase().split(":").some((segment) => segment === "cloud" || /(^|[-_])cloud($|[-_])/.test(segment));
}

export function localModelNames(models: string[]): string[] {
  return [...new Set(models.map((model) => model.trim()).filter((model) => model && !isCloudModel(model)))].sort((left, right) => left.localeCompare(right));
}

export function isRemovedOllamaModel(model?: string): boolean {
  return model?.toLowerCase().startsWith("phi4-mini") ?? false;
}

const blueprintResponseFormat = {
  type: "object",
  additionalProperties: false,
  required: ["blueprint", "plan", "warnings"],
  properties: {
    blueprint: {
      type: "object",
      additionalProperties: false,
      required: ["name", "description", "targetPath", "language", "framework", "dependencies", "architectureOverview", "coreLogic", "layoutDesign", "constraints"],
      properties: {
        name: { type: "string" }, description: { type: "string" }, targetPath: { type: "string" }, language: { type: "string" }, framework: { type: "string" },
        dependencies: { type: "array", items: { type: "string" } }, architectureOverview: { type: "string" }, coreLogic: { type: "string" }, layoutDesign: { type: "string" }, constraints: { type: "array", items: { type: "string" } }
      }
    },
    plan: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "steps", "filesToTouch", "assumptions", "acceptanceCriteria"],
      properties: {
        summary: { type: "string" }, steps: { type: "array", items: { type: "string" } }, filesToTouch: { type: "array", items: { type: "string" } }, assumptions: { type: "array", items: { type: "string" } }, acceptanceCriteria: { type: "array", items: { type: "string" } }
      }
    },
    warnings: { type: "array", items: { type: "string" } }
  }
};

const discoveryResponseFormat = {
  type: "object",
  additionalProperties: false,
  required: ["domain", "likelyStackOptions", "recommendedStackId", "missingInfo", "clarifyingQuestions"],
  properties: {
    domain: { type: ["string", "null"] },
    likelyStackOptions: { type: "array", maxItems: 3, items: { type: "object", additionalProperties: false, required: ["stackId", "reason", "confidence"], properties: { stackId: { type: "string" }, reason: { type: "string" }, confidence: { type: "number", minimum: 0, maximum: 1 } } } },
    recommendedStackId: { type: ["string", "null"] },
    missingInfo: { type: "array", items: { type: "string" } },
    clarifyingQuestions: { type: "array", maxItems: 3, items: { type: "string" } }
  }
};

function cleanJson(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("```") && trimmed.endsWith("```")) return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return trimmed;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()) : [];
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

function strictBlueprintRequest(request: BlueprintGenerateRequest): StrictBlueprintGenerateRequest {
  if (request.authorizedContext) {
    const context = contextFromAuthorization(request.authorizedContext);
    return { ...request, brief: request.authorizedContext.confirmedBrief, generatorId: request.authorizedContext.generatorPolicy.id, synthesisContext: context };
  }
  if (!request.brief || !request.generatorId || !request.synthesisContext || request.synthesisContext.stackId !== request.generatorId) throw new Error("Generator selection is mandatory before Ollama synthesis");
  return { ...request, brief: request.brief, generatorId: request.generatorId, synthesisContext: request.synthesisContext };
}

function discoveryInstruction(request: DiscoveryGenerateRequest): string {
  const registry = request.registrySlice.map((option) => `${option.stackId}: ${option.domainProfile}, ${option.platform}, ${option.language}, ${option.frameworkOptions.join("/")}`).join(" | ");
  return [
    "You are the Vault Discovery Analyzer. Return JSON only.",
    "Analyze the idea for discovery; never generate a blueprint, packet, code, folder structure, or implementation plan.",
    "Recommend only stack IDs present in the supplied registry slice. Do not invent or substitute a stack.",
    `Registry slice: ${registry || "none"}.`,
    `Extracted hard constraints: ${JSON.stringify(request.constraints)}.`,
    "If the idea is vague but compatible, return discovery questions. If no supplied stack fits, return an empty option list.",
    "Return exactly the requested discovery JSON shape."
  ].join(" ");
}

function synthesisInstruction(request: StrictBlueprintGenerateRequest): string {
  const context = request.synthesisContext;
  return [
    "You are an architecture synthesis engine. Convert the validated brief into JSON only.",
    "Synthesize from first principles within the selected generator context; do not substitute another stack or copy a web template.",
    `Platform: ${context.platform}. Language: ${context.language}. Allowed frameworks: ${context.frameworkOptions.join(", ")}.`,
    `Required components: ${context.requiredComponentKinds.join(", ")}.`,
    `Hard constraints: ${context.constraints.join("; ")}.`,
    `Prohibited substitutions: ${context.prohibitedSubstitutions.join("; ")}.`,
    "If the brief cannot be satisfied within this context, return REVIEW_REQUIRED rather than guessing.",
    "Return exactly the requested blueprint and implementation-plan JSON shape."
  ].join(" ");
}

function normalizeProposal(value: unknown, brief: string, request: StrictBlueprintGenerateRequest): unknown {
  const root = asObject(value);
  const rawBlueprint = asObject(root.blueprint);
  const rawPlan = asObject(root.plan);
  const name = asString(rawBlueprint.name, "Generated feature blueprint");
  const fileStem = name.replace(/[^a-zA-Z0-9]+/g, "").replace(/^./, (character) => character.toUpperCase()) || "GeneratedFeature";
  const context = request.synthesisContext;
  const synthesisDefaults = {
    targetPath: `generated/${fileStem}.${context.language.toLowerCase() === "swift" ? "swift" : context.language.toLowerCase() === "python" ? "py" : "tsx"}`,
    language: context.language,
    framework: context.frameworkOptions[0] ?? request.generatorId,
    architectureOverview: `A synthesized ${context.domainProfile} architecture derived from the brief and constrained by the registered domain context.`,
    coreLogic: `Derive the requested behavior while preserving: ${context.constraints.join("; ")}.`,
    layoutDesign: `Synthesize the ${context.platform} presentation from the brief.`
  };
  const missingCandidates: Array<[string, unknown]> = [
    ["blueprint.targetPath", rawBlueprint.targetPath], ["blueprint.language", rawBlueprint.language], ["blueprint.framework", rawBlueprint.framework]
  ];
  const repaired = missingCandidates.filter(([, candidate]) => typeof candidate !== "string" || !candidate.trim()).map(([path]) => path);
  const warnings = asStringArray(root.warnings);
  if (repaired.length > 0) warnings.push(`Ollama omitted ${repaired.join(", ")}; review the inserted defaults before approval.`);

  const returnedLanguage = asString(rawBlueprint.language, synthesisDefaults.language);
  const returnedFramework = asString(rawBlueprint.framework, synthesisDefaults.framework);
  if (returnedLanguage !== context.language) throw new Error(`Ollama returned language ${returnedLanguage}, outside the selected ${request.generatorId} context`);
  if (!context.frameworkOptions.includes(returnedFramework)) throw new Error(`Ollama returned framework ${returnedFramework}, outside the selected ${request.generatorId} context`);
  return {
    blueprint: {
      name,
      description: asString(rawBlueprint.description, brief),
      targetPath: asString(rawBlueprint.targetPath, synthesisDefaults.targetPath),
      language: returnedLanguage,
      framework: returnedFramework,
      dependencies: asStringArray(rawBlueprint.dependencies),
      architectureOverview: asString(rawBlueprint.architectureOverview, synthesisDefaults.architectureOverview),
      coreLogic: asString(rawBlueprint.coreLogic, synthesisDefaults.coreLogic),
      layoutDesign: asString(rawBlueprint.layoutDesign, synthesisDefaults.layoutDesign),
      constraints: asStringArray(rawBlueprint.constraints)
    },
    plan: {
      summary: asString(rawPlan.summary, "Implement the requested feature within the approved blueprint boundary."),
      steps: asStringArray(rawPlan.steps).length > 0 ? asStringArray(rawPlan.steps) : ["Define the typed data boundary.", "Implement the requested component states.", "Verify the acceptance criteria."],
      filesToTouch: asStringArray(rawPlan.filesToTouch).length > 0 ? asStringArray(rawPlan.filesToTouch) : [synthesisDefaults.targetPath],
      assumptions: asStringArray(rawPlan.assumptions),
      acceptanceCriteria: asStringArray(rawPlan.acceptanceCriteria).length > 0 ? asStringArray(rawPlan.acceptanceCriteria) : ["The generated behavior is reviewed against the original brief."]
    },
    warnings
  };
}

export class OllamaAiProvider implements AiProvider {
  readonly name = "ollama";
  readonly baseUrl: string;
  readonly analysisModel?: string;
  readonly creationModel?: string;
  get model(): string | undefined { return this.creationModel; }

  constructor(baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434", analysisModel = process.env.OLLAMA_ANALYSIS_MODEL ?? process.env.OLLAMA_MODEL, creationModel = process.env.OLLAMA_CREATION_MODEL ?? process.env.OLLAMA_MODEL) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.analysisModel = isRemovedOllamaModel(analysisModel) ? undefined : analysisModel;
    this.creationModel = isRemovedOllamaModel(creationModel) ? undefined : creationModel;
  }

  private requireModel(model: string | undefined, role: "analysis" | "creation"): string {
    if (!model) throw new Error(`Choose an Ollama ${role} model before running this action.`);
    return model;
  }

  async validate(prompt: string) {
    return { valid: prompt.trim().length > 0, issues: prompt.trim().length > 0 ? [] : ["Prompt is empty"] };
  }

  async generate(request: AiGenerateRequest): Promise<AiGenerateResult> {
    const started = Date.now();
    const model = this.requireModel(this.creationModel, "creation");
    const response = await this.request({ model, prompt: request.prompt, stream: false });
    return { artifactType: "ollama-response", artifactLocation: `ollama://${model}/executions/${request.executionId}`, output: response.response ?? "", metadata: { name: this.name, model, durationMs: Date.now() - started } };
  }

  async generateDiscovery(request: DiscoveryGenerateRequest): Promise<DiscoveryGenerateResult> {
    const started = Date.now();
    const model = this.requireModel(this.analysisModel, "analysis");
    const response = await this.request({ model, system: discoveryInstruction(request), prompt: request.brief, stream: false, format: discoveryResponseFormat });
    let parsed: unknown;
    try { parsed = JSON.parse(cleanJson(response.response ?? "")); } catch { throw new Error("Ollama returned invalid JSON for architecture discovery"); }
    const result = discoveryModelResultSchema.safeParse(parsed);
    if (!result.success) throw new Error(`Ollama discovery validation failed: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
    const metadata = { name: this.name, model, durationMs: Date.now() - started } as const;
    return { result: result.data, metadata };
  }

  async generateBlueprint(request: BlueprintGenerateRequest): Promise<BlueprintGenerateResult> {
    const strictRequest = strictBlueprintRequest(request);
    const started = Date.now();
    const model = this.requireModel(this.analysisModel, "analysis");
    const response = await this.request({ model, system: strictRequest.instruction ?? synthesisInstruction(strictRequest), prompt: strictRequest.brief, stream: false, format: blueprintResponseFormat });
    let parsed: unknown;
    try { parsed = JSON.parse(cleanJson(response.response ?? "")); } catch { throw new Error("Ollama returned invalid JSON for the blueprint proposal"); }
    const metadata = { name: this.name, model, durationMs: Date.now() - started } as const;
    const proposal = blueprintProposalSchema.omit({ provider: true }).safeParse(normalizeProposal(parsed, strictRequest.brief, strictRequest));
    if (!proposal.success) throw new Error(`Ollama blueprint validation failed: ${proposal.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
    return { proposal: { ...proposal.data, provider: metadata }, metadata };
  }

  async *stream(request: AiGenerateRequest): AsyncIterable<string> {
    const model = this.requireModel(this.creationModel, "creation");
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model, prompt: request.prompt, stream: true }),
        signal: request.signal
      });
    } catch (error) {
      if (request.signal?.aborted) throw new Error("Generation cancelled by client");
      throw new Error(`Unable to reach Ollama at ${this.baseUrl}`);
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as OllamaResponse;
      throw new Error(body.error ?? `Ollama returned HTTP ${response.status}`);
    }
    if (!response.body) throw new Error("Ollama returned an empty streaming response");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const payload = JSON.parse(trimmed) as OllamaResponse;
          if (payload.error) throw new Error(payload.error);
          if (payload.response) yield payload.response;
        }
        if (done) break;
      }
      const trailing = buffer.trim();
      if (trailing) {
        const payload = JSON.parse(trailing) as OllamaResponse;
        if (payload.error) throw new Error(payload.error);
        if (payload.response) yield payload.response;
      }
    } finally {
      reader.releaseLock();
    }
  }

  async health() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return { available: false, detail: `Ollama returned HTTP ${response.status}`, models: { analysis: this.analysisModel, creation: this.creationModel } };
      const body = await response.json() as OllamaTagsResponse;
      const names = (body.models ?? []).map((model) => model.name ?? "");
      const analysisInstalled = this.analysisModel ? names.some((name) => name === this.analysisModel || name.startsWith(`${this.analysisModel}:`)) : false;
      const creationInstalled = this.creationModel ? names.some((name) => name === this.creationModel || name.startsWith(`${this.creationModel}:`)) : false;
      const missing = [!this.analysisModel ? "an analysis model has not been selected" : !analysisInstalled ? `analysis model ${this.analysisModel} is not installed` : "", !this.creationModel ? "a creation model has not been selected" : !creationInstalled ? `creation model ${this.creationModel} is not installed` : ""].filter(Boolean);
      return { available: missing.length === 0, detail: missing.length === 0 ? `Ollama is ready with analysis and creation models` : `Ollama is running, but ${missing.join(" and ")}`, models: { analysis: this.analysisModel, creation: this.creationModel } };
    } catch { return { available: false, detail: `Ollama is unavailable at ${this.baseUrl}`, models: { analysis: this.analysisModel, creation: this.creationModel } }; }
  }

  async catalog(configured: { analysis: ProviderSelection; creation: ProviderSelection }): Promise<ProviderCatalog> {
    const refreshedAt = new Date().toISOString();
    const result = await this.listModels();
    const localModels = localModelNames(result.models).filter((model) => !isRemovedOllamaModel(model));
    const configuredModels = [configured.analysis, configured.creation]
      .filter((selection) => selection.provider === "ollama" && selection.model)
      .map((selection) => selection.model as string)
      .filter((model) => !isRemovedOllamaModel(model));
    const allModels = [...localModels, ...configuredModels.filter((model) => !localModels.includes(model) && !isCloudModel(model))];
    const options: ProviderModelOption[] = allModels.map((model) => ({ provider: "ollama", model, label: model, available: localModels.includes(model), cloud: isCloudModel(model) }));
    options.push({ provider: "mock", model: "deterministic-local", label: "Deterministic mock", available: true, cloud: false });
    return providerCatalogSchema.parse({ configured, models: options, ollamaAvailable: result.available, detail: result.detail, refreshedAt });
  }

  async listModels(): Promise<{ models: string[]; available: boolean; detail: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return { models: [], available: false, detail: `Ollama returned HTTP ${response.status}` };
      const body = await response.json() as OllamaTagsResponse;
      return { models: (body.models ?? []).map((model) => model.name ?? "").filter(Boolean), available: true, detail: "Ollama catalog refreshed" };
    } catch {
      return { models: [], available: false, detail: `Ollama is unavailable at ${this.baseUrl}` };
    }
  }

  private async request(body: Record<string, unknown>): Promise<OllamaResponse> {
    let response: Response;
    try { response = await fetch(`${this.baseUrl}/api/generate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); }
    catch { throw new Error(`Unable to reach Ollama at ${this.baseUrl}`); }
    const result = await response.json().catch(() => ({})) as OllamaResponse;
    if (!response.ok) throw new Error(result.error ?? `Ollama returned HTTP ${response.status}`);
    return result;
  }
}
