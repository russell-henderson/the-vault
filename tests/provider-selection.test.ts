import { describe, expect, it, vi } from "vitest";
import { buildApp } from "../apps/api/src/app";
import { VaultRepository } from "../apps/api/src/repository";
import { MockAiProvider } from "../apps/api/src/providers/mock-provider";

const blueprint = {
  name: "SelectionTarget", description: "A test component.", targetPath: "src/SelectionTarget.tsx", language: "TypeScript", framework: "React",
  dependencies: [], architectureOverview: "A bounded component.", coreLogic: "Render output.", layoutDesign: "Simple layout.", constraints: []
};

describe("provider catalog and role selection", () => {
  it("returns a catalog with a mock option and records selected role metadata", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ models: [{ name: "llama3.2:3b" }, { name: "llama3.2:cloud" }] }), { status: 200 }));
    const repository = new VaultRepository(":memory:");
    const app = buildApp(repository, new MockAiProvider(false));
    const catalog = await app.inject({ method: "GET", url: "/api/providers/models" });
    expect(catalog.statusCode).toBe(200);
    const catalogBody = catalog.json<{ models: Array<{ provider: string; model: string }>; embeddingModels?: Array<{ provider: string; model: string; capability?: string }> }>();
    const catalogModels = catalogBody.models;
    expect(catalogModels).toEqual(expect.arrayContaining([expect.objectContaining({ provider: "mock", model: "deterministic-local" }), expect.objectContaining({ provider: "ollama", model: "llama3.2:3b" })]));
    expect(catalogBody.embeddingModels).toEqual(expect.arrayContaining([expect.objectContaining({ provider: "openrouter", model: "nvidia/llama-nemotron-embed-vl-1b-v2:free", capability: "embedding" })]));

    const invalidEmbeddingGeneration = await app.inject({ method: "POST", url: "/api/blueprint-proposals", payload: { brief: "Build a React TypeScript analytics dashboard panel", generatorId: "react-typescript", analysis: { provider: "openrouter", model: "nvidia/llama-nemotron-embed-vl-1b-v2:free" } } });
    expect(invalidEmbeddingGeneration.statusCode).toBe(400);

    const discovery = await app.inject({ method: "POST", url: "/api/architecture-discovery", payload: { brief: "Build a React TypeScript analytics dashboard panel", analysis: { provider: "mock", model: "deterministic-local" } } });
    expect(discovery.statusCode).toBe(200);
    const proposal = await app.inject({ method: "POST", url: "/api/blueprint-proposals", payload: { brief: "Build a React TypeScript analytics dashboard panel", generatorId: "react-typescript", discovery: discovery.json(), analysis: { provider: "mock", model: "deterministic-local" } } });
    expect(proposal.statusCode).toBe(201);
    expect(proposal.json<{ provider: { name: string; model?: string } }>().provider).toMatchObject({ name: "mock", model: "deterministic-local" });

    const created = await app.inject({ method: "POST", url: "/api/blueprints", payload: blueprint });
    const prompt = await app.inject({ method: "POST", url: `/api/blueprints/${created.json<{ id: string }>().id}/generate-prompt` });
    const execution = await app.inject({ method: "POST", url: "/api/executions", payload: { promptArtifactId: prompt.json<{ promptArtifact: { id: string } }>().promptArtifact.id, creation: { provider: "mock", model: "deterministic-local" } } });
    expect(execution.statusCode).toBe(201);
    expect(execution.json<{ provider: { name: string; model?: string } }>().provider).toMatchObject({ name: "mock", model: "deterministic-local" });
    await app.close();
    fetchMock.mockRestore();
  });

  it("rejects an unknown selected Ollama model before generation", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ models: [{ name: "llama3.2:3b" }] }), { status: 200 }));
    const repository = new VaultRepository(":memory:");
    const app = buildApp(repository, new MockAiProvider(false));
    const response = await app.inject({ method: "POST", url: "/api/blueprint-proposals", payload: { brief: "Build a React TypeScript analytics dashboard panel", generatorId: "react-typescript", analysis: { provider: "ollama", model: "missing:latest" } } });
    expect(response.statusCode).toBe(400);
    await app.close();
    fetchMock.mockRestore();
  });

  it("evaluates the explicit OpenRouter embedding model without treating it as generation", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: [{ object: "embedding", embedding: [0.1, 0.2, 0.3, 0.4, 0.5] }], model: "nvidia/llama-nemotron-embed-vl-1b-v2:free", object: "list", usage: { prompt_tokens: 6, total_tokens: 6 } }), { status: 200, headers: { "content-type": "application/json" } }));
    const app = buildApp(new VaultRepository(":memory:"), new MockAiProvider(false));
    const response = await app.inject({ method: "POST", url: "/api/providers/embeddings/test", payload: { model: "nvidia/llama-nemotron-embed-vl-1b-v2:free", text: "What is in this image?" } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ model: "nvidia/llama-nemotron-embed-vl-1b-v2:free", dimensions: 5, preview: [0.1, 0.2, 0.3, 0.4, 0.5] });
    await app.close();
    fetchMock.mockRestore();
    vi.unstubAllEnvs();
  });

  it("does not synthesize a mock blueprint without a validated generator context", async () => {
    await expect(new MockAiProvider().generateBlueprint({ brief: "Build a dashboard" })).rejects.toThrow("Generator selection is mandatory");
  });
});
