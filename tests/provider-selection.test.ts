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
    const catalogModels = catalog.json<{ models: Array<{ provider: string; model: string }> }>().models;
    expect(catalogModels).toEqual(expect.arrayContaining([expect.objectContaining({ provider: "mock", model: "deterministic-local" }), expect.objectContaining({ provider: "ollama", model: "llama3.2:3b" })]));

    const proposal = await app.inject({ method: "POST", url: "/api/blueprint-proposals", payload: { brief: "Build a panel", analysis: { provider: "mock", model: "deterministic-local" } } });
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
    const response = await app.inject({ method: "POST", url: "/api/blueprint-proposals", payload: { brief: "Build a panel", analysis: { provider: "ollama", model: "missing:latest" } } });
    expect(response.statusCode).toBe(400);
    await app.close();
    fetchMock.mockRestore();
  });
});
