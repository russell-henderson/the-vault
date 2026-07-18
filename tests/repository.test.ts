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
    const prompt = repository.createPromptArtifact(blueprint.id, "# Prompt", { kind: "core-document", documentFilename: "API.md", sourceExecutionId: "prd-1", contextSummary: "# Summary" });
    const execution = repository.createExecutionRecord(blueprint.id, prompt.id, prompt.generatedPrompt, { documentFilename: "API.md", sourceExecutionId: "prd-1" });

    expect(repository.getBlueprint(blueprint.id)?.name).toBe("FeatureFlagPanel");
    expect(repository.listBlueprints()).toHaveLength(1);
    expect(prompt.version).toBe(1);
    expect(repository.getPromptArtifact(prompt.id)?.documentFilename).toBe("API.md");
    expect(execution.status).toBe("pending");
    expect(repository.getExecutionRecord(execution.id)?.sourceExecutionId).toBe("prd-1");
    repository.close();
  });

  it("canonicalizes tags and cascades blueprint deletion", () => {
    const repository = new VaultRepository(":memory:");
    const blueprint = repository.createBlueprint({ ...input, tags: [" Product Design ", "product_design", "PRODUCT-DESIGN"] });
    expect(blueprint.tags).toEqual(["product-design"]);
    const prompt = repository.createPromptArtifact(blueprint.id, "# Prompt");
    const execution = repository.createExecutionRecord(blueprint.id, prompt.id, prompt.generatedPrompt);
    expect(repository.deleteBlueprint(blueprint.id)).toBe(true);
    expect(repository.getBlueprint(blueprint.id)).toBeUndefined();
    expect(repository.getPromptArtifact(prompt.id)).toBeUndefined();
    expect(repository.getExecutionRecord(execution.id)).toBeUndefined();
    expect(repository.deleteBlueprint(blueprint.id)).toBe(false);
    repository.close();
  });
});
