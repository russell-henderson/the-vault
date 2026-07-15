import type { Blueprint, BlueprintInput, ExecutionRecord, PromptArtifact } from "@the-vault/shared";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { headers: { "content-type": "application/json", ...options?.headers }, ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? body.error ?? "Request failed");
  return body as T;
}

export const api = {
  listBlueprints: () => request<Blueprint[]>("/api/blueprints"),
  getBlueprint: (id: string) => request<Blueprint>(`/api/blueprints/${id}`),
  createBlueprint: (input: BlueprintInput) => request<Blueprint>("/api/blueprints", { method: "POST", body: JSON.stringify(input) }),
  getPrompt: (id: string) => request<PromptArtifact>(`/api/blueprints/${id}/prompt`),
  getExecutions: (id: string) => request<ExecutionRecord[]>(`/api/blueprints/${id}/executions`),
  generatePrompt: (id: string) => request<{ promptArtifact: PromptArtifact; executionRecord: ExecutionRecord }>(`/api/blueprints/${id}/generate-prompt`, { method: "POST" }),
  getExecution: (id: string) => request<ExecutionRecord>(`/api/executions/${id}`)
};
