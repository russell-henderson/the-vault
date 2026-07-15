import { describe, expect, it } from "vitest";
import { blueprintInputSchema } from "@the-vault/shared";

const validBlueprint = {
  name: "FeatureFlagPanel", description: "A dashboard panel.", targetPath: "src/FeatureFlagPanel.tsx", language: "TypeScript", framework: "React",
  dependencies: ["feature-flag-api"], architectureOverview: "A presentational component.", coreLogic: "Render states.", layoutDesign: "Accessible form.", constraints: ["No persistence"]
};

describe("blueprint validation", () => {
  it("accepts a complete blueprint", () => expect(blueprintInputSchema.parse(validBlueprint)).toEqual(validBlueprint));
  it("rejects missing required architecture fields", () => {
    const result = blueprintInputSchema.safeParse({ ...validBlueprint, coreLogic: "" });
    expect(result.success).toBe(false);
  });
});
