import { describe, expect, it } from "vitest";
import { ExecutionService } from "../apps/api/src/services/execution-service";
import { MockAiProvider } from "../apps/api/src/providers/mock-provider";
import { VaultRepository } from "../apps/api/src/repository";

const blueprintInput = {
  name: "ExecutionTarget", description: "A test component.", targetPath: "src/ExecutionTarget.tsx", language: "TypeScript", framework: "React",
  dependencies: [], architectureOverview: "A bounded component.", coreLogic: "Render output.", layoutDesign: "Simple layout.", constraints: []
};

describe("AI provider and execution lifecycle", () => {
  it("validates, generates, and streams through the mock provider", async () => {
    const provider = new MockAiProvider();
    expect((await provider.validate("prompt")).valid).toBe(true);
    expect((await provider.validate("[INVALID_PROMPT]")).valid).toBe(false);
    const result = await provider.generate({ prompt: "prompt", executionId: "execution-1" });
    expect(result.artifactType).toBe("implementation-plan");
    const chunks: string[] = [];
    for await (const chunk of provider.stream({ prompt: "prompt", executionId: "execution-1" })) chunks.push(chunk);
    expect(chunks.join(" ")).toContain("Mock Codex Result");
  });

  it("records a completed execution with output evidence", async () => {
    const repository = new VaultRepository(":memory:");
    const blueprint = repository.createBlueprint(blueprintInput);
    const prompt = repository.createPromptArtifact(blueprint.id, "# prompt");
    const execution = await new ExecutionService(repository, new MockAiProvider()).execute(prompt);
    expect(execution.status).toBe("completed");
    expect(execution.inputPrompt).toBe("# prompt");
    expect(execution.generatedOutput).toContain("Mock Codex Result");
    expect(execution.startedAt).not.toBeNull();
    expect(execution.completedAt).not.toBeNull();
    repository.close();
  });

  it("records a failed execution when the provider fails", async () => {
    const repository = new VaultRepository(":memory:");
    const blueprint = repository.createBlueprint(blueprintInput);
    const prompt = repository.createPromptArtifact(blueprint.id, "[MOCK_PROVIDER_FAILURE]");
    const execution = await new ExecutionService(repository, new MockAiProvider()).execute(prompt);
    expect(execution.status).toBe("failed");
    expect(execution.verificationNotes).toContain("Mock provider failure requested");
    repository.close();
  });
});
