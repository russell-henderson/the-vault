import { describe, expect, it } from "vitest";
import { buildApp } from "../apps/api/src/app";
import { VaultRepository } from "../apps/api/src/repository";

const blueprint = {
  name: "FeatureFlagPanel", description: "A dashboard panel.", targetPath: "src/FeatureFlagPanel.tsx", language: "TypeScript", framework: "React",
  dependencies: ["feature-flag-api"], architectureOverview: "A presentational component.", coreLogic: "Render states.", layoutDesign: "Accessible form.", constraints: ["No persistence"]
};

describe("blueprint API workflow", () => {
  it("keeps discovery separate from final packet synthesis", async () => {
    const repository = new VaultRepository(":memory:");
    const app = buildApp(repository);
    const response = await app.inject({ method: "POST", url: "/api/architecture-discovery", payload: { brief: "Build a dashboard for internal analytics.", provider: "mock" } });
    expect(response.statusCode).toBe(200);
    const result = response.json<{ status: string; likelyStackOptions: unknown[]; architecturePacket?: unknown; blueprint?: unknown }>();
    expect(result.status).toBe("discovery");
    expect(result.likelyStackOptions.length).toBeGreaterThan(0);
    expect(result.architecturePacket).toBeUndefined();
    expect(result.blueprint).toBeUndefined();
    await app.close();
  });

  it("returns discovery review as a handled state instead of an HTTP error", async () => {
    const repository = new VaultRepository(":memory:");
    const app = buildApp(repository);
    const response = await app.inject({ method: "POST", url: "/api/architecture-discovery", payload: { brief: "Build a Vue TypeScript web dashboard.", provider: "mock" } });
    expect(response.statusCode).toBe(200);
    expect(response.json<{ status: string; unsupportedDiscoveries: Array<{ technology: string }> }>().status).toBe("review-required");
    expect(response.json<{ unsupportedDiscoveries: Array<{ technology: string }> }>().unsupportedDiscoveries.map((discovery) => discovery.technology)).toContain("vue");
    await app.close();
  });

  it("requires a confirmed generator before final synthesis", async () => {
    const repository = new VaultRepository(":memory:");
    const app = buildApp(repository);
    const response = await app.inject({ method: "POST", url: "/api/blueprint-proposals", payload: { brief: "Build a React TypeScript web dashboard.", provider: "mock" } });
    expect(response.statusCode).toBe(422);
    expect(response.json<{ status: string; reasons: string[] }>().reasons.join(" ")).toContain("confirmed generatorId");
    await app.close();
  });

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

    const discovery = await app.inject({ method: "POST", url: "/api/architecture-discovery", payload: { brief: "Build an accessible analytics panel.", provider: "mock" } });
    expect(discovery.statusCode).toBe(200);
    const direction = discovery.json<{ recommendedStackId: string; status: string }>();
    expect(direction.status).toBe("discovery");
    const proposal = await app.inject({ method: "POST", url: "/api/blueprint-proposals", payload: { brief: "Build an accessible analytics panel.", generatorId: direction.recommendedStackId, discovery: discovery.json(), provider: "mock" } });
    expect(proposal.statusCode).toBe(201);
    const result = proposal.json<{ blueprint: { source?: string; implementationPlan?: unknown }; plan: { filesToTouch: string[] }; provider: { name: string; fallback?: boolean } }>();
    expect(result.blueprint.source).toBe("mock");
    expect(result.blueprint.implementationPlan).toBeTruthy();
    expect(result.plan.filesToTouch.length).toBeGreaterThan(0);
    expect(result.provider.fallback).toBe(true);
    await app.close();
  });

  it("routes domain-aware proposals through the registry and preserves the packet", async () => {
    const repository = new VaultRepository(":memory:");
    const app = buildApp(repository);
    const discovery = await app.inject({ method: "POST", url: "/api/architecture-discovery", payload: { brief: "Build a Swift SpriteKit mobile physics game with collision handling.", analysis: { provider: "mock", model: "deterministic-local" } } });
    expect(discovery.statusCode).toBe(200);
    const proposal = await app.inject({ method: "POST", url: "/api/blueprint-proposals", payload: { brief: "Build a Swift SpriteKit mobile physics game with collision handling.", generatorId: "swift-spritekit", discovery: discovery.json(), analysis: { provider: "mock", model: "deterministic-local" } } });
    expect(proposal.statusCode).toBe(201);
    const result = proposal.json<{ classification: { evidence: { recommendedStackId: string } }; architecturePacket: { stack: { id: string }; components: Array<{ kind: string }> }; blueprint: { architecturePacket?: { stack: { id: string } } } }>();
    expect(result.classification.evidence.recommendedStackId).toBe("swift-spritekit");
    expect(result.architecturePacket.stack.id).toBe("swift-spritekit");
    expect(result.architecturePacket.components.map((component) => component.kind)).toContain("PhysicsController");

    const saved = await app.inject({ method: "POST", url: "/api/blueprints", payload: result.blueprint });
    expect(saved.statusCode).toBe(201);
    expect(saved.json<{ architecturePacket?: { stack: { id: string } } }>().architecturePacket?.stack.id).toBe("swift-spritekit");
    await app.close();
  });

  it("returns Review Required without saving an unsupported stack", async () => {
    const repository = new VaultRepository(":memory:");
    const app = buildApp(repository);
    const response = await app.inject({ method: "POST", url: "/api/blueprint-proposals", payload: { brief: "Build a Rust command-line compiler plugin.", provider: "mock" } });
    expect(response.statusCode).toBe(422);
    expect(response.json<{ status: string; reasons: string[] }>().status).toBe("review-required");
    expect(repository.listBlueprints()).toHaveLength(0);
    await app.close();
  });

  it("returns structured Review Required for an unsupported explicit framework", async () => {
    const repository = new VaultRepository(":memory:");
    const app = buildApp(repository);
    const response = await app.inject({ method: "POST", url: "/api/blueprint-proposals", payload: { brief: "Build a SwiftUI iOS settings application. No web.", provider: "mock" } });
    const result = response.json<{ status: string; constraints: { frameworks: string[] }; reasons: string[]; questions: string[] }>();

    expect(response.statusCode).toBe(422);
    expect(result.status).toBe("review-required");
    expect(result.constraints.frameworks).toEqual(["swiftui"]);
    expect(result.reasons.join(" ")).toContain("registered generator");
    expect(result.questions.length).toBeGreaterThan(0);
    expect(repository.listBlueprints()).toHaveLength(0);
    await app.close();
  });
});
