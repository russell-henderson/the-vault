import type { Blueprint, BlueprintInput, BlueprintProposal, ExecutionRecord, PromptArtifact, ProviderCatalog, ProviderSelection, ProviderStatus } from "@the-vault/shared";

export type ExecutionDetails = ExecutionRecord & { prompt: string; evidence: { verificationNotes: string } };

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export class ApiRequestError extends Error {
  constructor(message: string, readonly status = 0, readonly details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  const hasBody = options?.body !== undefined && options.body !== null;
  if (hasBody && !headers.has("content-type")) headers.set("content-type", "application/json");
  headers.set("accept", "application/json");
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiRequestError("Unable to reach the local API. Make sure the API server is running and try again.");
  }
  const rawBody = await response.text();
  let body: { message?: string; error?: string } & Record<string, unknown> = {};
  if (rawBody.trim()) {
    try { body = JSON.parse(rawBody) as typeof body; } catch { body = { message: rawBody }; }
  }
  if (!response.ok) throw new ApiRequestError(body.message ?? body.error ?? `Request failed (${response.status})`, response.status, body);
  return body as T;
}

export const api = {
  listBlueprints: () => request<Blueprint[]>("/api/blueprints"),
  getProviderStatus: () => request<ProviderStatus>("/api/providers/status"),
  getProviderCatalog: () => request<ProviderCatalog>("/api/providers/models"),
  generateBlueprintProposal: (brief: string, provider: "configured" | "mock" = "configured", analysis?: ProviderSelection) => request<BlueprintProposal>("/api/blueprint-proposals", { method: "POST", body: JSON.stringify({ brief, provider, ...(analysis ? { analysis } : {}) }) }),
  getBlueprint: (id: string) => request<Blueprint>(`/api/blueprints/${id}`),
  createBlueprint: (input: BlueprintInput) => request<Blueprint>("/api/blueprints", { method: "POST", body: JSON.stringify(input) }),
  getPrompt: (id: string) => request<PromptArtifact>(`/api/blueprints/${id}/prompt`),
  getExecutions: (id: string) => request<ExecutionRecord[]>(`/api/blueprints/${id}/executions`),
  generatePrompt: (id: string) => request<{ promptArtifact: PromptArtifact; executionRecord: ExecutionRecord }>(`/api/blueprints/${id}/generate-prompt`, { method: "POST", body: JSON.stringify({ blueprintId: id }) }),
  getExecution: (id: string) => request<ExecutionDetails>(`/api/executions/${id}`),
  launchExecution: (promptArtifactId: string, provider: "configured" | "mock" = "configured", creation?: ProviderSelection) => request<ExecutionDetails>("/api/executions", { method: "POST", body: JSON.stringify({ promptArtifactId, provider, ...(creation ? { creation } : {}) }) }),
  verifyExecution: (id: string, verificationNotes: string) => request<ExecutionDetails>(`/api/executions/${id}/verify`, { method: "POST", body: JSON.stringify({ verificationNotes }) })
};
