import { describe, expect, it, vi } from "vitest";
import { createGeneratorRegistry } from "@the-vault/prompts";
import { ArchitectureAnalyzer } from "../apps/api/src/services/architecture-analyzer.js";
import { ArchitectureOrchestrator } from "../apps/api/src/services/architecture-orchestrator.js";
import { extractConstraints } from "../apps/api/src/services/constraint-extractor.js";
import type { AiProvider } from "../apps/api/src/providers/types.js";

describe("Stage 6 authority boundary", () => {
  it("rejects unknown, version-drifted, and hash-drifted requests", () => {
    const registry = createGeneratorRegistry();
    const explicitConstraints = extractConstraints("Build a React TypeScript web dashboard.");
    expect(registry.validateRequest({ generatorId: "vue-generator", explicitConstraints }).violations.map((violation) => violation.code)).toContain("unknown-generator");

    const generator = registry.getGenerator("react-typescript");
    if (!generator) throw new Error("Expected the React generator");
    expect(registry.validateRequest({ generatorId: generator.stackId, requestedVersion: "20.0.0", explicitConstraints }).violations.map((violation) => violation.code)).toContain("unsupported-version");
    expect(registry.validateRequest({ generatorId: generator.stackId, policyHash: "stale-policy", explicitConstraints }).violations.map((violation) => violation.code)).toContain("policy-hash-mismatch");
  });

  it("returns only policy-authorized options and rejects incompatible explicit constraints", () => {
    const registry = createGeneratorRegistry();
    expect(registry.getAuthorizedOptions({ platform: "mobile" }).map((option) => option.stackId)).toEqual(["swift-spritekit"]);
    const result = registry.validateRequest({ generatorId: "swift-spritekit", explicitConstraints: extractConstraints("Build a SwiftUI iOS settings app.") });
    expect(result.status).toBe("review-required");
    expect(result.violations.map((violation) => violation.code)).toEqual(expect.arrayContaining(["constraint-framework-conflict"]));
  });

  it("keeps unsupported enrichment visible without making it actionable", async () => {
    const generateDiscovery = vi.fn().mockResolvedValue({ result: { domain: "web-dashboard", likelyStackOptions: [{ stackId: "vue-generator", reason: "model suggestion", confidence: 0.99 }], recommendedStackId: "vue-generator", missingInfo: [], clarifyingQuestions: [] }, metadata: { name: "local-test" } });
    const provider = { generateDiscovery } as unknown as AiProvider;
    const result = await new ArchitectureAnalyzer().analyze("Build a Vue TypeScript web dashboard.", provider);
    expect(result.status).toBe("review-required");
    expect(result.suggestedGeneratorId).toBeNull();
    expect(result.unsupportedDiscoveries.some((discovery) => discovery.technology === "vue")).toBe(true);
  });

  it("builds a provider request from the passed registry authorization only", () => {
    const orchestrator = new ArchitectureOrchestrator();
    const preparation = orchestrator.prepareConfirmed("Build a Swift SpriteKit iOS physics game.", "swift-spritekit");
    expect(preparation.status).toBe("ready");
    if (preparation.status !== "ready") throw new Error("Expected authorization to pass");
    const request = orchestrator.buildAuthorizedProviderRequest(preparation);
    expect(Object.keys(request).sort()).toEqual(["authorizedContext", "confirmedBrief"]);
    expect(request.authorizedContext.generatorPolicy.id).toBe("swift-spritekit");
    expect(request.authorizedContext.provenance.policyHash).toBe(preparation.registryValidation.policyHash);
    expect(request.authorizedContext.provenance.validationStatus).toBe("passed");
  });
});
