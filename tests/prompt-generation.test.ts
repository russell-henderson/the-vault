import { describe, expect, it } from "vitest";
import { generateCodexPrompt } from "@the-vault/prompts";
import type { Blueprint } from "@the-vault/shared";

const blueprint: Blueprint = {
  id: "blueprint-1", name: "FeatureFlagPanel", description: "A dashboard panel.", targetPath: "src/FeatureFlagPanel.tsx", language: "TypeScript", framework: "React",
  dependencies: ["feature-flag-api"], architectureOverview: "A presentational component.", coreLogic: "Render states.", layoutDesign: "Accessible form.", constraints: ["No persistence"],
  createdAt: "2026-07-15T00:00:00.000Z", updatedAt: "2026-07-15T00:00:00.000Z"
};

describe("deterministic prompt generation", () => {
  it("includes blueprint context and stable instructions", () => {
    const first = generateCodexPrompt(blueprint);
    expect(first).toContain("FeatureFlagPanel");
    expect(first).toContain("No persistence");
    expect(first).toBe(generateCodexPrompt(blueprint));
  });
});
