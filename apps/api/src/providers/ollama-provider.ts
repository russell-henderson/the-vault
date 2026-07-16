import { blueprintProposalSchema } from "@the-vault/shared";
import type { AiGenerateRequest, AiGenerateResult, AiProvider, BlueprintGenerateRequest, BlueprintGenerateResult } from "./types.js";

type OllamaResponse = { response?: string; error?: string };

const blueprintInstruction = `You are an architecture assistant. Convert the user's brief into JSON only. Return exactly this shape:
{
  "blueprint": { "name": string, "description": string, "targetPath": string, "language": string, "framework": string, "dependencies": string[], "architectureOverview": string, "coreLogic": string, "layoutDesign": string, "constraints": string[] },
  "plan": { "summary": string, "steps": string[], "filesToTouch": string[], "assumptions": string[], "acceptanceCriteria": string[] },
  "warnings": string[]
}
Keep the implementation bounded. Never invent secrets. Make assumptions explicit. Use concise, concrete values suitable for human review.`;

function cleanJson(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("```") && trimmed.endsWith("```")) return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return trimmed;
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
    const response = await this.request({ model: this.analysisModel, system: blueprintInstruction, prompt: request.brief, stream: false, format: "json" });
    let parsed: unknown;
    try { parsed = JSON.parse(cleanJson(response.response ?? "")); } catch { throw new Error("Ollama returned invalid JSON for the blueprint proposal"); }
    const metadata = { name: this.name, model: this.analysisModel, durationMs: Date.now() - started } as const;
    const proposal = blueprintProposalSchema.omit({ provider: true }).safeParse(parsed);
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
      const body = await response.json() as { models?: Array<{ name?: string }> };
      const names = (body.models ?? []).map((model) => model.name ?? "");
      const analysisInstalled = names.some((name) => name === this.analysisModel || name.startsWith(`${this.analysisModel}:`));
      const creationInstalled = names.some((name) => name === this.creationModel || name.startsWith(`${this.creationModel}:`));
      const missing = [!analysisInstalled ? `analysis model ${this.analysisModel}` : "", !creationInstalled ? `creation model ${this.creationModel}` : ""].filter(Boolean);
      return { available: missing.length === 0, detail: missing.length === 0 ? `Ollama is ready with analysis and creation models` : `Ollama is running, but ${missing.join(" and ")} ${missing.length === 1 ? "is" : "are"} not installed`, models: { analysis: this.analysisModel, creation: this.creationModel } };
    } catch { return { available: false, detail: `Ollama is unavailable at ${this.baseUrl}`, models: { analysis: this.analysisModel, creation: this.creationModel } }; }
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
