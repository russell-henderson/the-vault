import type { Blueprint, BlueprintInput, BlueprintProposal, BlueprintWorkspace, CoreDocumentFilename, DiscoveryResult, ExecutionRecord, PromptArtifact, ProviderCatalog, ProviderSelection, ProviderStatus } from "@the-vault/shared";

export type ExecutionDetails = ExecutionRecord & { prompt: string; evidence: { verificationNotes: string } };

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export type StreamHandlers = {
  onChunk: (chunk: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
};

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
  if (!response.ok) {
    const reasons = Array.isArray(body.reasons) ? body.reasons.filter((reason): reason is string => typeof reason === "string") : [];
    const questions = Array.isArray(body.questions) ? body.questions.filter((question): question is string => typeof question === "string") : [];
    const detail = [...reasons, ...questions].join(" ");
    throw new ApiRequestError(body.message ?? body.error ?? (detail || `Request failed (${response.status})`), response.status, body);
  }
  return body as T;
}

export const api = {
  listBlueprints: () => request<Blueprint[]>("/api/blueprints"),
  getProviderStatus: () => request<ProviderStatus>("/api/providers/status"),
  getProviderCatalog: () => request<ProviderCatalog>("/api/providers/models"),
  analyzeArchitecture: (brief: string, provider: "configured" | "mock" = "configured", analysis?: ProviderSelection) => request<DiscoveryResult>("/api/architecture-discovery", { method: "POST", body: JSON.stringify({ brief, provider, ...(analysis ? { analysis } : {}) }) }),
  generateBlueprintProposal: (brief: string, generatorId: string, discovery?: DiscoveryResult, provider: "configured" | "mock" = "configured", analysis?: ProviderSelection) => request<BlueprintProposal>("/api/blueprint-proposals", { method: "POST", body: JSON.stringify({ brief, generatorId, provider, ...(analysis ? { analysis } : {}), ...(discovery ? { discovery } : {}) }) }),
  getBlueprint: (id: string) => request<Blueprint>(`/api/blueprints/${id}`),
  createBlueprint: (input: BlueprintInput) => request<Blueprint>("/api/blueprints", { method: "POST", body: JSON.stringify(input) }),
  getPrompt: (id: string) => request<PromptArtifact>(`/api/blueprints/${id}/prompt`),
  getExecutions: (id: string) => request<ExecutionRecord[]>(`/api/blueprints/${id}/executions`),
  getWorkspace: (id: string) => request<BlueprintWorkspace>(`/api/blueprints/${id}/workspace`),
  generatePrompt: (id: string) => request<{ promptArtifact: PromptArtifact; executionRecord: ExecutionRecord }>(`/api/blueprints/${id}/generate-prompt`, { method: "POST", body: JSON.stringify({ blueprintId: id }) }),
  getExecution: (id: string) => request<ExecutionDetails>(`/api/executions/${id}`),
  launchExecution: (promptArtifactId: string, provider: "configured" | "mock" = "configured", creation?: ProviderSelection) => request<ExecutionDetails>("/api/executions", { method: "POST", body: JSON.stringify({ promptArtifactId, provider, ...(creation ? { creation } : {}) }) }),
  verifyExecution: (id: string, verificationNotes: string) => request<ExecutionDetails>(`/api/executions/${id}/verify`, { method: "POST", body: JSON.stringify({ verificationNotes }) }),
  generateCoreDocs: (blueprintId: string, requestedFiles: CoreDocumentFilename[], creation?: ProviderSelection) => request<{ workspace: BlueprintWorkspace; executions: ExecutionRecord[] }>(`/api/blueprints/${blueprintId}/generate-core-docs`, { method: "POST", body: JSON.stringify({ requestedFiles, creation }) }),
  rerollDocument: (blueprintId: string, filename: CoreDocumentFilename, creation?: ProviderSelection) => request<{ execution: ExecutionRecord; workspace: BlueprintWorkspace }>(`/api/blueprints/${blueprintId}/reroll-doc`, { method: "POST", body: JSON.stringify({ filename, creation }) }),
  streamCoreDocument: (blueprintId: string, filename: CoreDocumentFilename, creation: ProviderSelection | undefined, handlers: StreamHandlers) => {
    const params = new URLSearchParams({ filename });
    if (creation?.provider) params.set("provider", creation.provider);
    if (creation?.model) params.set("model", creation.model);
    const source = new EventSource(`${API_BASE}/api/blueprints/${blueprintId}/generate/stream?${params.toString()}`);
    let finished = false;
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { chunk?: unknown; status?: string; message?: string };
        if (typeof payload.chunk === "string") handlers.onChunk(payload.chunk);
        if (payload.status === "DONE") {
          finished = true;
          source.close();
          handlers.onDone();
        } else if (payload.status === "ERROR") {
          finished = true;
          source.close();
          handlers.onError(typeof payload.message === "string" ? payload.message : "Document generation failed");
        }
      } catch {
        finished = true;
        source.close();
        handlers.onError("The server returned an invalid streaming event");
      }
    };
    source.onerror = () => {
      if (finished) return;
      finished = true;
      source.close();
      handlers.onError("The document stream disconnected before completion");
    };
    return source;
  },
  extrapolate: (description: string, model?: string) => request<{ projectName: string; architectureOverview: string; coreLogic: string; dependencies: string[]; technicalConstraints: string[]; comments: string[] }>("/api/blueprints/extrapolate", { method: "POST", body: JSON.stringify({ description, model }) }),
  patchBlueprint: (id: string, updates: { projectName?: string; tags?: string[] }) => request<Blueprint>(`/api/blueprints/${id}`, { method: "PATCH", body: JSON.stringify(updates) }),
  deleteBlueprint: (id: string) => request<{ success: boolean }>(`/api/blueprints/${id}`, { method: "DELETE" }),
  bulkDeleteBlueprints: (ids: string[]) => request<{ success: boolean; count: number }>("/api/blueprints/bulk-delete", { method: "POST", body: JSON.stringify({ ids }) }),
  syncToDisk: (id: string, targetPath: string, files: { filename: string; content: string }[]) => request<{ success: boolean; writtenPaths: string[] }>(`/api/blueprints/${id}/sync-to-disk`, { method: "POST", body: JSON.stringify({ targetPath, files }) })
};
