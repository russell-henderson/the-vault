import { describe, expect, it } from "vitest";
import { buildApp } from "../apps/api/src/app";
import { MockAiProvider } from "../apps/api/src/providers/mock-provider";
import { VaultRepository } from "../apps/api/src/repository";

describe("execution evidence API", () => {
  it("stores verification notes against an execution", async () => {
    const repository = new VaultRepository(":memory:");
    const app = buildApp(repository, new MockAiProvider());
    const blueprint = repository.createBlueprint({ name: "Evidence", description: "Test", targetPath: "src/Evidence.ts", language: "TypeScript", framework: "Node", dependencies: [], architectureOverview: "Boundary", coreLogic: "Logic", layoutDesign: "UI", constraints: [] });
    const prompt = repository.createPromptArtifact(blueprint.id, "# Evidence prompt");
    const created = await app.inject({ method: "POST", url: "/api/executions", payload: { promptArtifactId: prompt.id } });
    expect(created.statusCode).toBe(201);
    const executionId = created.json<{ id: string }>().id;
    const verified = await app.inject({ method: "POST", url: `/api/executions/${executionId}/verify`, payload: { verificationNotes: "Reviewed output against the component boundary." } });
    expect(verified.statusCode).toBe(200);
    expect(verified.json<{ evidence: { verificationNotes: string } }>().evidence.verificationNotes).toContain("component boundary");
    await app.close();
  });
});
