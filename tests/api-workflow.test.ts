import { describe, expect, it } from "vitest";
import { buildApp } from "../apps/api/src/app";
import { VaultRepository } from "../apps/api/src/repository";

const blueprint = {
  name: "FeatureFlagPanel", description: "A dashboard panel.", targetPath: "src/FeatureFlagPanel.tsx", language: "TypeScript", framework: "React",
  dependencies: ["feature-flag-api"], architectureOverview: "A presentational component.", coreLogic: "Render states.", layoutDesign: "Accessible form.", constraints: ["No persistence"]
};

describe("blueprint API workflow", () => {
  it("creates, generates, and retrieves the prompt and execution history", async () => {
    const repository = new VaultRepository(":memory:");
    const app = buildApp(repository);
    const created = await app.inject({ method: "POST", url: "/api/blueprints", payload: blueprint });
    expect(created.statusCode).toBe(201);
    const createdBlueprint = created.json<{ id: string }>();

    const generated = await app.inject({ method: "POST", url: `/api/blueprints/${createdBlueprint.id}/generate-prompt` });
    expect(generated.statusCode).toBe(201);
    const result = generated.json<{ promptArtifact: { id: string }; executionRecord: { id: string; status: string } }>();
    expect(result.promptArtifact.id).toBeTruthy();
    expect(result.executionRecord.status).toBe("pending");

    const prompt = await app.inject({ method: "GET", url: `/api/blueprints/${createdBlueprint.id}/prompt` });
    const executions = await app.inject({ method: "GET", url: `/api/blueprints/${createdBlueprint.id}/executions` });
    const execution = await app.inject({ method: "GET", url: `/api/executions/${result.executionRecord.id}` });
    expect(prompt.statusCode).toBe(200);
    expect(prompt.json<{ generatedPrompt: string }>().generatedPrompt).toContain("FeatureFlagPanel");
    expect(executions.json()).toHaveLength(1);
    expect(execution.json<{ id: string }>().id).toBe(result.executionRecord.id);
    await app.close();
  });

  it("returns structured validation errors", async () => {
    const repository = new VaultRepository(":memory:");
    const app = buildApp(repository);
    const response = await app.inject({ method: "POST", url: "/api/blueprints", payload: { name: "" } });
    expect(response.statusCode).toBe(400);
    expect(response.json<{ error: string; issues: unknown }>().error).toBe("Invalid blueprint");
    await app.close();
  });

  it("generates a validated blueprint proposal and exposes provider status", async () => {
    const repository = new VaultRepository(":memory:");
    const app = buildApp(repository);
    const status = await app.inject({ method: "GET", url: "/api/providers/status" });
    expect(status.statusCode).toBe(200);
    expect(status.json<{ configured: { name: string }; available: boolean }>().configured.name).toBe("mock");

    const proposal = await app.inject({ method: "POST", url: "/api/blueprint-proposals", payload: { brief: "Build an accessible analytics panel.", provider: "mock" } });
    expect(proposal.statusCode).toBe(201);
    const result = proposal.json<{ blueprint: { source?: string; implementationPlan?: unknown }; plan: { filesToTouch: string[] }; provider: { name: string; fallback?: boolean } }>();
    expect(result.blueprint.source).toBe("mock");
    expect(result.blueprint.implementationPlan).toBeTruthy();
    expect(result.plan.filesToTouch.length).toBeGreaterThan(0);
    expect(result.provider.fallback).toBe(true);
    await app.close();
  });
});
