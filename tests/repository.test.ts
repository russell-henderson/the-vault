import { describe, expect, it } from "vitest";
import { VaultRepository } from "../apps/api/src/repository";

const input = {
  name: "FeatureFlagPanel", description: "A dashboard panel.", targetPath: "src/FeatureFlagPanel.tsx", language: "TypeScript", framework: "React",
  dependencies: ["feature-flag-api"], architectureOverview: "A presentational component.", coreLogic: "Render states.", layoutDesign: "Accessible form.", constraints: ["No persistence"]
};

describe("VaultRepository", () => {
  it("persists blueprints, prompt artifacts, and execution records", () => {
    const repository = new VaultRepository(":memory:");
    const blueprint = repository.createBlueprint(input);
    const prompt = repository.createPromptArtifact(blueprint.id, "# Prompt");
    const execution = repository.createExecutionRecord(blueprint.id, prompt.id);

    expect(repository.getBlueprint(blueprint.id)?.name).toBe("FeatureFlagPanel");
    expect(repository.listBlueprints()).toHaveLength(1);
    expect(prompt.version).toBe(1);
    expect(execution.status).toBe("pending");
    repository.close();
  });
});
