import { describe, expect, it } from "vitest";
import { generateCodexPrompt, generateContextSummary, generateCoreDocumentPrompt } from "@the-vault/prompts";
import type { Blueprint } from "@the-vault/shared";

const blueprint: Blueprint = {
  id: "blueprint-1", name: "FeatureFlagPanel", description: "A dashboard panel.", targetPath: "src/FeatureFlagPanel.tsx", language: "TypeScript", framework: "React",
  dependencies: ["feature-flag-api"], architectureOverview: "A presentational component.", coreLogic: "Render states.", layoutDesign: "Accessible form.", constraints: ["No persistence"], technicalConstraints: ["Local-first"],
  createdAt: "2026-07-15T00:00:00.000Z", updatedAt: "2026-07-15T00:00:00.000Z"
};

describe("deterministic prompt generation", () => {
  it("includes blueprint context and stable instructions", () => {
    const first = generateCodexPrompt(blueprint);
    expect(first).toContain("FeatureFlagPanel");
    expect(first).toContain("Problem and Value Proposition");
    expect(first).toContain("Do not include technical architecture");
    expect(first).not.toContain("No persistence");
    expect(first).not.toContain("feature-flag-api");
    expect(first).toContain("### [CONTEXT_BLOCK: IDENTITY]");
    expect(first).toContain("### [CONTEXT_BLOCK: SPECIFICATION]");
    expect(first).not.toContain("### [CONTEXT_BLOCK: CONSTRAINTS]");
    expect(first).toBe(generateCodexPrompt(blueprint));
  });

  it("creates a concise verification summary and isolated document prompt", () => {
    expect(generateContextSummary(blueprint)).toContain("# FeatureFlagPanel");
    const apiPrompt = generateCoreDocumentPrompt("# Product requirements", "API.md");
    expect(apiPrompt).toContain("You are a Backend Systems Architect writing the API.md contract.");
    expect(apiPrompt).toContain("Do not invent internal service endpoints");
    expect(apiPrompt).toContain("Target document: API.md");
    expect(apiPrompt).toContain("PRIMARY SYSTEM CONTEXT: PRD.md");
    expect(apiPrompt).toContain("# Product requirements");
    expect(apiPrompt.endsWith("You are generating a final markdown file. Do not echo, print, or acknowledge the [CONTEXT_BLOCK] labels.")).toBe(true);

    const architecturePrompt = generateCoreDocumentPrompt("# Product requirements", "ARCHITECTURE.md");
    expect(architecturePrompt).toContain("ParsingService for syllabus extraction and validation");
    expect(architecturePrompt).toContain("ProgressService for progress calculations and state transitions");
    expect(architecturePrompt).toContain("BentoGrid, Timeline, and AssignmentEditor");

    const dataModelsPrompt = generateCoreDocumentPrompt("# Product requirements", "DATA_MODELS.md");
    expect(dataModelsPrompt).toContain("JSON-Schema-style definitions for Course and Assignment");
    const componentsPrompt = generateCoreDocumentPrompt("# Product requirements", "COMPONENTS.md");
    expect(componentsPrompt).toContain("exclude trivial layout components such as Header and Footer");
    expect(componentsPrompt).toContain("BentoGrid, Timeline, and AssignmentEditor");
    expect(generateCoreDocumentPrompt("# Product requirements", "DEVELOPMENT_PLAN.md")).toContain("three-phase execution roadmap");
    expect(generateCoreDocumentPrompt("# Product requirements", "TESTING_STRATEGY.md")).toContain("precision tests for ParsingService syllabus extraction");
  });
});
