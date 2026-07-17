import { describe, expect, it } from "vitest";
import { buildApp } from "../apps/api/src/app";
import { MockAiProvider } from "../apps/api/src/providers/mock-provider";
import { VaultRepository } from "../apps/api/src/repository";

const manualBlueprint = {
  name: "DiscoveryActionsPanel",
  description: "A small panel used to verify the complete discovery and action workflow.",
  targetPath: "src/DiscoveryActionsPanel.tsx",
  language: "TypeScript",
  framework: "React",
  dependencies: ["feature-api"],
  architectureOverview: "A presentational panel behind a typed API boundary.",
  coreLogic: "Render loading, error, empty, and ready states.",
  layoutDesign: "Keyboard-accessible dashboard panel.",
  constraints: ["No persistence in the component"]
};

describe("discovery and actions API contract", () => {
  it("walks every discovery/action route through success, review, validation, and retrieval paths", async () => {
    const repository = new VaultRepository(":memory:");
    const app = buildApp(repository, new MockAiProvider(false));

    try {
      const preflight = await app.inject({
        method: "OPTIONS",
        url: "/api/architecture-discovery",
        headers: { origin: "http://localhost:5173", "access-control-request-method": "POST", "access-control-request-headers": "content-type" }
      });
      expect(preflight.statusCode).toBe(204);

      const providerStatus = await app.inject({ method: "GET", url: "/api/providers/status" });
      expect(providerStatus.statusCode).toBe(200);
      expect(providerStatus.json<{ configured: { name: string }; available: boolean }>().configured.name).toBe("mock");

      const providerModels = await app.inject({ method: "GET", url: "/api/providers/models" });
      expect(providerModels.statusCode).toBe(200);
      const providerModelOptions = providerModels.json<{ models: Array<{ provider: string; model: string; cloud: boolean }> }>().models;
      expect(providerModelOptions).toEqual(expect.arrayContaining([expect.objectContaining({ provider: "mock", model: "deterministic-local" })]));
      expect(providerModelOptions.filter((model) => /(^|[-_])cloud($|[-_])/.test(model.model.toLowerCase())).every((model) => model.cloud)).toBe(true);

      const initialBlueprints = await app.inject({ method: "GET", url: "/api/blueprints" });
      expect(initialBlueprints.statusCode).toBe(200);
      expect(initialBlueprints.json()).toEqual([]);

      const invalidDiscovery = await app.inject({ method: "POST", url: "/api/architecture-discovery", payload: { brief: "" } });
      expect(invalidDiscovery.statusCode).toBe(400);

      const discovery = await app.inject({ method: "POST", url: "/api/architecture-discovery", payload: { brief: "Build a React TypeScript web dashboard for analytics.", provider: "mock" } });
      expect(discovery.statusCode).toBe(200);
      const discoveryResult = discovery.json<{ status: string; suggestedGeneratorId: string | null; likelyStackOptions: Array<{ stackId: string }>; architecturePacket?: unknown; blueprint?: unknown }>();
      expect(discoveryResult.status).toBe("discovery");
      expect(discoveryResult.suggestedGeneratorId).toBe("react-typescript");
      expect(discoveryResult.likelyStackOptions.map((option) => option.stackId)).toContain("react-typescript");
      expect(discoveryResult.architecturePacket).toBeUndefined();
      expect(discoveryResult.blueprint).toBeUndefined();

      const unsupportedDiscovery = await app.inject({ method: "POST", url: "/api/architecture-discovery", payload: { brief: "Build a Vue TypeScript web dashboard.", provider: "mock" } });
      expect(unsupportedDiscovery.statusCode).toBe(200);
      expect(unsupportedDiscovery.json<{ status: string; unsupportedDiscoveries: Array<{ technology: string }> }>().status).toBe("review-required");
      expect(unsupportedDiscovery.json<{ unsupportedDiscoveries: Array<{ technology: string }> }>().unsupportedDiscoveries.map((item) => item.technology)).toContain("vue");

      const missingGenerator = await app.inject({ method: "POST", url: "/api/blueprint-proposals", payload: { brief: "Build a React TypeScript web dashboard.", provider: "mock" } });
      expect(missingGenerator.statusCode).toBe(422);
      expect(missingGenerator.json<{ status: string; reasons: string[] }>().reasons.join(" ")).toContain("confirmed generatorId");
      expect(repository.listBlueprints()).toHaveLength(0);

      const proposal = await app.inject({
        method: "POST",
        url: "/api/blueprint-proposals",
        payload: { brief: "Build a React TypeScript web dashboard for analytics.", generatorId: "react-typescript", discovery: discoveryResult, provider: "mock" }
      });
      expect(proposal.statusCode).toBe(201);
      const proposalResult = proposal.json<{ blueprint: { id?: string; source?: string; architecturePacket?: { stack: { id: string } } }; architecturePacket: { stack: { id: string }; provenance: { metadata: Record<string, unknown> } }; provenance: { requestId: string; generatorId: string; registryVersion: string; policyHash: string; validationStatus: string } }>();
      expect(proposalResult.blueprint.source).toBe("mock");
      expect(proposalResult.architecturePacket.stack.id).toBe("react-typescript");
      expect(proposalResult.provenance).toMatchObject({ generatorId: "react-typescript", validationStatus: "passed" });
      expect(proposalResult.provenance.requestId).toBeTruthy();
      expect(proposalResult.provenance.policyHash).toBeTruthy();

      const invalidBlueprint = await app.inject({ method: "POST", url: "/api/blueprints", payload: { name: "" } });
      expect(invalidBlueprint.statusCode).toBe(400);

      const createdBlueprint = await app.inject({ method: "POST", url: "/api/blueprints", payload: manualBlueprint });
      expect(createdBlueprint.statusCode).toBe(201);
      const blueprint = createdBlueprint.json<{ id: string }>();

      const listedBlueprints = await app.inject({ method: "GET", url: "/api/blueprints" });
      expect(listedBlueprints.statusCode).toBe(200);
      expect(listedBlueprints.json<Array<{ id: string }>>().map((item) => item.id)).toContain(blueprint.id);

      const fetchedBlueprint = await app.inject({ method: "GET", url: `/api/blueprints/${blueprint.id}` });
      expect(fetchedBlueprint.statusCode).toBe(200);
      expect(fetchedBlueprint.json<{ name: string }>().name).toBe(manualBlueprint.name);

      const missingBlueprint = await app.inject({ method: "GET", url: "/api/blueprints/missing-blueprint" });
      expect(missingBlueprint.statusCode).toBe(404);

      const generatedPrompt = await app.inject({ method: "POST", url: `/api/blueprints/${blueprint.id}/generate-prompt` });
      expect(generatedPrompt.statusCode).toBe(201);
      const promptResult = generatedPrompt.json<{ promptArtifact: { id: string }; executionRecord: { id: string; status: string } }>();
      expect(promptResult.promptArtifact.id).toBeTruthy();
      expect(promptResult.executionRecord.status).toBe("pending");

      const fetchedPrompt = await app.inject({ method: "GET", url: `/api/blueprints/${blueprint.id}/prompt` });
      expect(fetchedPrompt.statusCode).toBe(200);
      expect(fetchedPrompt.json<{ generatedPrompt: string }>().generatedPrompt).toContain("DiscoveryActionsPanel");

      const missingPrompt = await app.inject({ method: "GET", url: "/api/blueprints/missing-blueprint/prompt" });
      expect(missingPrompt.statusCode).toBe(404);

      const pendingExecutions = await app.inject({ method: "GET", url: `/api/blueprints/${blueprint.id}/executions` });
      expect(pendingExecutions.statusCode).toBe(200);
      expect(pendingExecutions.json<Array<{ id: string }>>().map((item) => item.id)).toContain(promptResult.executionRecord.id);

      const execution = await app.inject({ method: "POST", url: "/api/executions", payload: { promptArtifactId: promptResult.promptArtifact.id, provider: "mock" } });
      expect(execution.statusCode).toBe(201);
      const executionResult = execution.json<{ id: string; status: string; provider?: { name: string }; prompt: string }>();
      expect(executionResult.status).toBe("completed");
      expect(executionResult.provider?.name).toBe("mock");
      expect(executionResult.prompt).toContain("DiscoveryActionsPanel");

      const fetchedExecution = await app.inject({ method: "GET", url: `/api/executions/${executionResult.id}` });
      expect(fetchedExecution.statusCode).toBe(200);
      expect(fetchedExecution.json<{ id: string }>().id).toBe(executionResult.id);

      const invalidVerification = await app.inject({ method: "POST", url: `/api/executions/${executionResult.id}/verify`, payload: { verificationNotes: "" } });
      expect(invalidVerification.statusCode).toBe(400);

      const verification = await app.inject({ method: "POST", url: `/api/executions/${executionResult.id}/verify`, payload: { verificationNotes: "Reviewed against the manual blueprint acceptance criteria." } });
      expect(verification.statusCode).toBe(200);
      expect(verification.json<{ evidence: { verificationNotes: string } }>().evidence.verificationNotes).toContain("acceptance criteria");

      const executionsAfterVerification = await app.inject({ method: "GET", url: `/api/blueprints/${blueprint.id}/executions` });
      expect(executionsAfterVerification.statusCode).toBe(200);
      expect(executionsAfterVerification.json<Array<{ provider?: { name: string }; status: string; verificationNotes: string }>>()[0]).toMatchObject({ status: "completed", verificationNotes: expect.stringContaining("acceptance criteria"), provider: { name: "mock" } });

      const missingExecution = await app.inject({ method: "GET", url: "/api/executions/missing-execution" });
      expect(missingExecution.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });
});
