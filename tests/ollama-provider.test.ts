import { describe, expect, it, vi } from "vitest";
import { isCloudModel, localModelNames, OllamaAiProvider } from "../apps/api/src/providers/ollama-provider";

describe("Ollama provider", () => {
  it("normalizes a strict JSON blueprint proposal", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ response: JSON.stringify({
      blueprint: { name: "Panel", description: "A panel", targetPath: "src/Panel.tsx", language: "TypeScript", framework: "React", dependencies: [], architectureOverview: "Boundary", coreLogic: "Render states", layoutDesign: "Accessible layout", constraints: ["No persistence"] },
      plan: { summary: "Build it", steps: ["Implement"], filesToTouch: ["src/Panel.tsx"], assumptions: [], acceptanceCriteria: ["It renders"] },
      warnings: []
    }) }), { status: 200, headers: { "content-type": "application/json" } }));
    const provider = new OllamaAiProvider("http://ollama.test", "analysis-model", "creation-model");
    const result = await provider.generateBlueprint({ brief: "Build a panel" });
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
    await expect(new OllamaAiProvider("http://ollama.test", "demo-model").generateBlueprint({ brief: "Build a panel" })).rejects.toThrow("invalid JSON");
    fetchMock.mockRestore();
  });

  it("repairs omitted structural fields with visible warnings", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ response: JSON.stringify({ blueprint: { name: "Analytics Panel" }, plan: { summary: "Build it" }, warnings: [] }) }), { status: 200 }));
    const result = await new OllamaAiProvider("http://ollama.test", "analysis-model", "creation-model").generateBlueprint({ brief: "Build an analytics panel" });
    expect(result.proposal.blueprint.targetPath).toBe("src/components/AnalyticsPanel.tsx");
    expect(result.proposal.blueprint.framework).toBe("React + Tailwind");
    expect(result.proposal.warnings[0]).toContain("omitted");
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
