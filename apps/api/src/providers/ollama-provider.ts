import { blueprintProposalSchema, providerCatalogSchema, type ProviderCatalog, type ProviderModelOption, type ProviderSelection } from "@the-vault/shared";
import type { AiGenerateRequest, AiGenerateResult, AiProvider, BlueprintGenerateRequest, BlueprintGenerateResult } from "./types.js";

type OllamaResponse = { response?: string; error?: string };
type OllamaTagsResponse = { models?: Array<{ name?: string }> };

export function isCloudModel(model: string): boolean {
  return model.toLowerCase().split(":").includes("cloud");
}

export function localModelNames(models: string[]): string[] {
  return [...new Set(models.map((model) => model.trim()).filter((model) => model && !isCloudModel(model)))].sort((left, right) => left.localeCompare(right));
}

const blueprintInstruction = `You are an architecture assistant. Convert the user's brief into JSON only. Return exactly this shape:
{
  "blueprint": { "name": string, "description": string, "targetPath": string, "language": string, "framework": string, "dependencies": string[], "architectureOverview": string, "coreLogic": string, "layoutDesign": string, "constraints": string[] },
  "plan": { "summary": string, "steps": string[], "filesToTouch": string[], "assumptions": string[], "acceptanceCriteria": string[] },
  "warnings": string[]
}
Keep the implementation bounded. Never invent secrets. Make assumptions explicit. Use concise, concrete values suitable for human review.`;

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

function normalizeProposal(value: unknown, brief: string, request: BlueprintGenerateRequest): unknown {
  const root = asObject(value);
  const rawBlueprint = asObject(root.blueprint);
  const rawPlan = asObject(root.plan);
  const name = asString(rawBlueprint.name, "Generated feature blueprint");
  const fileStem = name.replace(/[^a-zA-Z0-9]+/g, "").replace(/^./, (character) => character.toUpperCase()) || "GeneratedFeature";
  if (request.generatorId && !request.synthesisContext) throw new Error("Generator synthesis context is required for strict blueprint generation");
  const synthesisDefaults = request.synthesisContext ? {
    targetPath: `generated/${fileStem}.${request.synthesisContext.language.toLowerCase() === "swift" ? "swift" : request.synthesisContext.language.toLowerCase() === "python" ? "py" : "tsx"}`,
    language: request.synthesisContext.language,
    framework: request.synthesisContext.frameworkOptions[0] ?? request.generatorId ?? "Generated framework",
    architectureOverview: `A synthesized ${request.synthesisContext.domainProfile} architecture derived from the brief and constrained by the registered domain context.`,
    coreLogic: `Derive the requested behavior while preserving: ${request.synthesisContext.constraints.join("; ")}.`,
    layoutDesign: `Synthesize the ${request.synthesisContext.platform} presentation from the brief.`
  } : {
    targetPath: `src/components/${fileStem}.tsx`,
    language: "TypeScript",
    framework: "React + Tailwind",
    architectureOverview: `A bounded component derived from this brief: ${brief}`,
    coreLogic: brief,
    layoutDesign: "Responsive, accessible UI with explicit loading, error, empty, and ready states."
  };
  const missingCandidates: Array<[string, unknown]> = [
    ["blueprint.targetPath", rawBlueprint.targetPath], ["blueprint.language", rawBlueprint.language], ["blueprint.framework", rawBlueprint.framework]
  ];
  const repaired = missingCandidates.filter(([, candidate]) => typeof candidate !== "string" || !candidate.trim()).map(([path]) => path);
  const warnings = asStringArray(root.warnings);
  if (repaired.length > 0) warnings.push(`Ollama omitted ${repaired.join(", ")}; review the inserted defaults before approval.`);
  return {
    blueprint: {
      name,
      description: asString(rawBlueprint.description, brief),
      targetPath: asString(rawBlueprint.targetPath, synthesisDefaults.targetPath),
      language: asString(rawBlueprint.language, synthesisDefaults.language),
      framework: asString(rawBlueprint.framework, synthesisDefaults.framework),
      dependencies: asStringArray(rawBlueprint.dependencies),
      architectureOverview: asString(rawBlueprint.architectureOverview, synthesisDefaults.architectureOverview),
      coreLogic: asString(rawBlueprint.coreLogic, synthesisDefaults.coreLogic),
      layoutDesign: asString(rawBlueprint.layoutDesign, synthesisDefaults.layoutDesign),
      constraints: asStringArray(rawBlueprint.constraints)
    },
    plan: {
      summary: asString(rawPlan.summary, "Implement the requested feature within the approved blueprint boundary."),
      steps: asStringArray(rawPlan.steps).length > 0 ? asStringArray(rawPlan.steps) : ["Define the typed data boundary.", "Implement the requested component states.", "Verify the acceptance criteria."],
      filesToTouch: asStringArray(rawPlan.filesToTouch).length > 0 ? asStringArray(rawPlan.filesToTouch) : [`src/components/${fileStem}.tsx`, `tests/${fileStem}.test.tsx`],
      assumptions: asStringArray(rawPlan.assumptions),
      acceptanceCriteria: asStringArray(rawPlan.acceptanceCriteria).length > 0 ? asStringArray(rawPlan.acceptanceCriteria) : ["The generated behavior is reviewed against the original brief."]
    },
    warnings
  };
}

export class OllamaAiProvider implements AiProvider {
  readonly name = "ollama";
  readonly baseUrl: string;
  readonly analysisModel: string;
  readonly creationModel: string;

  constructor(baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434", analysisModel = process.env.OLLAMA_ANALYSIS_MODEL ?? process.env.OLLAMA_MODEL ?? "llama3.2:3b", creationModel = process.env.OLLAMA_CREATION_MODEL ?? process.env.OLLAMA_MODEL ?? "dolphin3:8b") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.analysisModel = analysisModel;
    this.creationModel = creationModel;
  }

  async validate(prompt: string) {
    return { valid: prompt.trim().length > 0, issues: prompt.trim().length > 0 ? [] : ["Prompt is empty"] };
  }

  async generate(request: AiGenerateRequest): Promise<AiGenerateResult> {
    const started = Date.now();
    const response = await this.request({ model: this.creationModel, prompt: request.prompt, stream: false });
    return { artifactType: "ollama-response", artifactLocation: `ollama://${this.creationModel}/executions/${request.executionId}`, output: response.response ?? "", metadata: { name: this.name, model: this.creationModel, durationMs: Date.now() - started } };
  }

  async generateBlueprint(request: BlueprintGenerateRequest): Promise<BlueprintGenerateResult> {
    const started = Date.now();
    const response = await this.request({ model: this.analysisModel, system: request.instruction ?? blueprintInstruction, prompt: request.brief, stream: false, format: blueprintResponseFormat });
    let parsed: unknown;
    try { parsed = JSON.parse(cleanJson(response.response ?? "")); } catch { throw new Error("Ollama returned invalid JSON for the blueprint proposal"); }
    const metadata = { name: this.name, model: this.analysisModel, durationMs: Date.now() - started } as const;
    const proposal = blueprintProposalSchema.omit({ provider: true }).safeParse(normalizeProposal(parsed, request.brief, request));
    if (!proposal.success) throw new Error(`Ollama blueprint validation failed: ${proposal.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
    return { proposal: { ...proposal.data, provider: metadata }, metadata };
  }

  async *stream(request: AiGenerateRequest): AsyncIterable<string> {
    yield (await this.generate(request)).output;
  }

  async health() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return { available: false, detail: `Ollama returned HTTP ${response.status}`, models: { analysis: this.analysisModel, creation: this.creationModel } };
      const body = await response.json() as OllamaTagsResponse;
      const names = (body.models ?? []).map((model) => model.name ?? "");
      const analysisInstalled = names.some((name) => name === this.analysisModel || name.startsWith(`${this.analysisModel}:`));
      const creationInstalled = names.some((name) => name === this.creationModel || name.startsWith(`${this.creationModel}:`));
      const missing = [!analysisInstalled ? `analysis model ${this.analysisModel}` : "", !creationInstalled ? `creation model ${this.creationModel}` : ""].filter(Boolean);
      return { available: missing.length === 0, detail: missing.length === 0 ? `Ollama is ready with analysis and creation models` : `Ollama is running, but ${missing.join(" and ")} ${missing.length === 1 ? "is" : "are"} not installed`, models: { analysis: this.analysisModel, creation: this.creationModel } };
    } catch { return { available: false, detail: `Ollama is unavailable at ${this.baseUrl}`, models: { analysis: this.analysisModel, creation: this.creationModel } }; }
  }

  async catalog(configured: { analysis: ProviderSelection; creation: ProviderSelection }): Promise<ProviderCatalog> {
    const refreshedAt = new Date().toISOString();
    const result = await this.listModels();
    const localModels = localModelNames(result.models);
    const configuredModels = [configured.analysis, configured.creation]
      .filter((selection) => selection.provider === "ollama" && selection.model)
      .map((selection) => selection.model as string);
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
