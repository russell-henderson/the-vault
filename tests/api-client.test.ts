import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, setApiConnection } from "../apps/web/src/lib/api";

describe("web API client", () => {
  beforeEach(() => setApiConnection({ kind: "companion", baseUrl: "http://127.0.0.1:3001", token: "test-token" }));
  afterEach(() => setApiConnection(undefined));
  it("serializes a JSON body for prompt compilation", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ promptArtifact: {}, executionRecord: {} }), { status: 201, headers: { "content-type": "application/json" } }));
    await api.generatePrompt("blueprint-1");
    const [, options] = fetchMock.mock.calls[0] ?? [];
    expect(options?.headers).toBeInstanceOf(Headers);
    expect(JSON.parse(String(options?.body))).toEqual({ blueprintId: "blueprint-1" });
    expect((options?.headers as Headers).get("content-type")).toBe("application/json");
    expect((options?.headers as Headers).get("authorization")).toBe("Bearer test-token");
    fetchMock.mockRestore();
  });

  it("surfaces structured review reasons from proposal validation", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ status: "review-required", reasons: ["A confirmed generator is required."], questions: ["Which platform should this target?"] }), { status: 422, headers: { "content-type": "application/json" } }));
    await expect(api.generateBlueprintProposal("Build an app", "swift-spritekit")).rejects.toMatchObject({ message: "A confirmed generator is required. Which platform should this target?", status: 422 });
    expect(fetchMock).toHaveBeenCalled();
    fetchMock.mockRestore();
  });

  it("sends the selected document filter to the workspace generation endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ workspace: {}, executions: [] }), { status: 201, headers: { "content-type": "application/json" } }));
    await api.generateCoreDocs("blueprint-1", ["README.md", "API.md"], { provider: "mock", model: "deterministic-local" });
    const [, options] = fetchMock.mock.calls[0] ?? [];
    expect(JSON.parse(String(options?.body))).toEqual({ requestedFiles: ["README.md", "API.md"], creation: { provider: "mock", model: "deterministic-local" } });
    fetchMock.mockRestore();
  });
});
