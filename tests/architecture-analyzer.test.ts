import { describe, expect, it, vi } from "vitest";
import { ArchitectureAnalyzer } from "../apps/api/src/services/architecture-analyzer.js";
import { MockAiProvider } from "../apps/api/src/providers/mock-provider.js";
import type { AiProvider } from "../apps/api/src/providers/types.js";

describe("architecture discovery analyzer", () => {
  it("returns discovery questions for a vague but supportable idea", async () => {
    const result = await new ArchitectureAnalyzer().analyze("Build an app that helps people track habits.", new MockAiProvider(false));

    expect(result.status).toBe("discovery");
    expect(result.likelyStackOptions.length).toBeGreaterThan(0);
    expect(result.clarifyingQuestions.length).toBeGreaterThan(0);
  });

  it("stops an unsupported explicit framework before asking a provider", async () => {
    const generateDiscovery = vi.fn();
    const provider = { generateDiscovery } as unknown as AiProvider;
    const result = await new ArchitectureAnalyzer().analyze("Build a Vue TypeScript web dashboard.", provider);

    expect(result.status).toBe("review-required");
    expect(result.constraints.unrecognizedMentions).toContain("vue");
    expect(generateDiscovery).not.toHaveBeenCalled();
  });

  it("rejects a provider recommendation outside the compact registry slice", async () => {
    const provider = {
      generateDiscovery: vi.fn().mockResolvedValue({ result: { domain: "web-dashboard", likelyStackOptions: [{ stackId: "unsupported-generator", reason: "invalid", confidence: 0.99 }], recommendedStackId: "unsupported-generator", missingInfo: [], clarifyingQuestions: [] }, metadata: { name: "test", model: "test" } })
    } as unknown as AiProvider;
    const result = await new ArchitectureAnalyzer().analyze("Build a React TypeScript web dashboard.", provider);

    expect(result.status).toBe("review-required");
    expect(result.reasons.join(" ")).toContain("unsupported generator ID");
  });
});
