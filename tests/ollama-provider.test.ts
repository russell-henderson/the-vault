import { describe, expect, it, vi } from "vitest";
import { isCloudModel, localModelNames, OllamaAiProvider } from "../apps/api/src/providers/ollama-provider";

describe("Ollama provider", () => {
  const reactSynthesis = {
    generatorId: "react-typescript",
    synthesisContext: { stackId: "react-typescript", domainProfile: "web-dashboard", platform: "web" as const, language: "TypeScript", frameworkOptions: ["React", "React + Tailwind"], requiredComponentKinds: ["ViewLayer"], architecturalTraits: ["browser UI"], constraints: ["Preserve keyboard accessibility."], prohibitedSubstitutions: ["SpriteKit", "Flet", "SwiftUI"] }
  };

  it("normalizes a strict JSON blueprint proposal", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ response: JSON.stringify({
      blueprint: { name: "Panel", description: "A panel", targetPath: "src/Panel.tsx", language: "TypeScript", framework: "React", dependencies: [], architectureOverview: "Boundary", coreLogic: "Render states", layoutDesign: "Accessible layout", constraints: ["No persistence"] },
      plan: { summary: "Build it", steps: ["Implement"], filesToTouch: ["src/Panel.tsx"], assumptions: [], acceptanceCriteria: ["It renders"] },
      warnings: []
    }) }), { status: 200, headers: { "content-type": "application/json" } }));
    const provider = new OllamaAiProvider("http://ollama.test", "analysis-model", "creation-model");
    const result = await provider.generateBlueprint({ brief: "Build a panel", ...reactSynthesis });
    expect(result.proposal.blueprint.name).toBe("Panel");
    expect(result.metadata.model).toBe("analysis-model");
    expect(fetchMock).toHaveBeenCalledWith("http://ollama.test/api/generate", expect.objectContaining({ method: "POST" }));
    const analysisRequest = JSON.parse(String(fetchMock.mock.calls[0]?.[1] && (fetchMock.mock.calls[0][1] as RequestInit).body)) as { model: string };
    expect(analysisRequest.model).toBe("analysis-model");
    const creation = await provider.generate({ prompt: "Create the artifact", executionId: "execution-1" });
    expect(creation.metadata?.model).toBe("creation-model");
    const creationRequest = JSON.parse(String(fetchMock.mock.calls[1]?.[1] && (fetchMock.mock.calls[1][1] as RequestInit).body)) as { model: string };
    expect(creationRequest.model).toBe("creation-model");
    fetchMock.mockRestore();
  });

  it("rejects malformed model output", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ response: "not json" }), { status: 200 }));
    await expect(new OllamaAiProvider("http://ollama.test", "demo-model").generateBlueprint({ brief: "Build a panel", ...reactSynthesis })).rejects.toThrow("invalid JSON");
    fetchMock.mockRestore();
  });

  it("keeps Ollama discovery scoped to the supplied registry slice", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ response: JSON.stringify({ domain: "web-dashboard", likelyStackOptions: [{ stackId: "react-typescript", reason: "Dashboard signals fit.", confidence: 0.9 }], recommendedStackId: "react-typescript", missingInfo: [], clarifyingQuestions: [] }) }), { status: 200 }));
    const result = await new OllamaAiProvider("http://ollama.test", "analysis-model").generateDiscovery({
      brief: "Build a dashboard",
      registrySlice: [{ stackId: "react-typescript", domainProfile: "web-dashboard", platform: "web", language: "TypeScript", frameworkOptions: ["React"], supportedIntentSignals: ["dashboard"], architecturalTraits: ["browser UI"], requiredComponentKinds: ["ViewLayer"], constraints: [], prohibitedSubstitutions: [], version: "2.0.0" }],
      constraints: { platforms: ["web"], languages: ["typescript"], frameworks: [], stackMentions: ["web", "typescript"], prohibitions: [], unrecognizedMentions: [], tokens: ["build", "a", "dashboard"] }
    });
    expect(result.result.recommendedStackId).toBe("react-typescript");
    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1] && (fetchMock.mock.calls[0][1] as RequestInit).body)) as { system: string };
    expect(request.system).toContain("Do not invent or substitute a stack");
    expect(request.system).toContain("react-typescript");
    fetchMock.mockRestore();
  });

  it("repairs omitted structural fields with visible warnings", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ response: JSON.stringify({ blueprint: { name: "Analytics Panel" }, plan: { summary: "Build it" }, warnings: [] }) }), { status: 200 }));
    const result = await new OllamaAiProvider("http://ollama.test", "analysis-model", "creation-model").generateBlueprint({ brief: "Build an analytics panel", ...reactSynthesis });
    expect(result.proposal.blueprint.targetPath).toBe("generated/AnalyticsPanel.tsx");
    expect(result.proposal.blueprint.framework).toBe("React");
    expect(result.proposal.plan.filesToTouch).toEqual(["generated/AnalyticsPanel.tsx"]);
    expect(result.proposal.warnings[0]).toContain("omitted");
    fetchMock.mockRestore();
  });

  it("uses strict synthesis constraints instead of a React fallback", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ response: JSON.stringify({ blueprint: { name: "Physics Scene" }, plan: { summary: "Synthesize it" }, warnings: [] }) }), { status: 200 }));
    const result = await new OllamaAiProvider("http://ollama.test", "analysis-model", "creation-model").generateBlueprint({
      brief: "Build a SpriteKit physics scene",
      generatorId: "swift-spritekit",
      synthesisContext: { stackId: "swift-spritekit", domainProfile: "mobile-physics", platform: "mobile", language: "Swift", frameworkOptions: ["SpriteKit"], requiredComponentKinds: ["PhysicsController"], architecturalTraits: ["physics loop"], constraints: ["Keep physics state explicit."], prohibitedSubstitutions: ["React"] }
    });
    expect(result.proposal.blueprint.language).toBe("Swift");
    expect(result.proposal.blueprint.framework).toBe("SpriteKit");
    expect(result.proposal.blueprint.framework).not.toBe("React + Tailwind");
    expect(result.proposal.plan.filesToTouch).toEqual(["generated/PhysicsScene.swift"]);
    fetchMock.mockRestore();
  });

  it("rejects missing generator context before making a provider request", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const provider = new OllamaAiProvider("http://ollama.test", "analysis-model");

    await expect(provider.generateBlueprint({ brief: "Build a panel" })).rejects.toThrow("Generator selection is mandatory");
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockRestore();
  });

  it("rejects model output outside the selected synthesis context", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ response: JSON.stringify({ blueprint: { name: "Physics Scene", language: "TypeScript", framework: "React" }, plan: { summary: "Synthesize it" }, warnings: [] }) }), { status: 200 }));

    await expect(new OllamaAiProvider("http://ollama.test", "analysis-model").generateBlueprint({
      brief: "Build a SpriteKit physics scene",
      generatorId: "swift-spritekit",
      synthesisContext: { stackId: "swift-spritekit", domainProfile: "mobile-physics", platform: "mobile", language: "Swift", frameworkOptions: ["SpriteKit"], requiredComponentKinds: ["PhysicsController"], architecturalTraits: ["physics loop"], constraints: ["Keep physics state explicit."], prohibitedSubstitutions: ["React"] }
    })).rejects.toThrow("outside the selected swift-spritekit context");
    fetchMock.mockRestore();
  });

  it("filters cloud models and always includes the deterministic mock", async () => {
    expect(isCloudModel("llama3.2:cloud")).toBe(true);
    expect(localModelNames(["llama3.2:cloud", "dolphin3:8b", "dolphin3:8b", "llama3.2-16k:latest"])).toEqual(["dolphin3:8b", "llama3.2-16k:latest"]);
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ models: [{ name: "llama3.2:3b" }, { name: "llama3.2:cloud" }] }), { status: 200 }));
    const catalog = await new OllamaAiProvider("http://ollama.test", "llama3.2:3b", "llama3.2:3b").catalog({ analysis: { provider: "ollama", model: "llama3.2:3b" }, creation: { provider: "ollama", model: "llama3.2:3b" } });
    expect(catalog.models.map((model) => model.model)).toEqual(["llama3.2:3b", "deterministic-local"]);
    expect(catalog.models.find((model) => model.provider === "mock")?.available).toBe(true);
    fetchMock.mockRestore();
  });
});
