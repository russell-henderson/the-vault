import { describe, expect, it, vi } from "vitest";
import { api } from "../apps/web/src/lib/api";

describe("web API client", () => {
  it("serializes a JSON body for prompt compilation", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ promptArtifact: {}, executionRecord: {} }), { status: 201, headers: { "content-type": "application/json" } }));
    await api.generatePrompt("blueprint-1");
    const [, options] = fetchMock.mock.calls[0] ?? [];
    expect(options?.headers).toBeInstanceOf(Headers);
    expect(JSON.parse(String(options?.body))).toEqual({ blueprintId: "blueprint-1" });
    expect((options?.headers as Headers).get("content-type")).toBe("application/json");
    fetchMock.mockRestore();
  });

  it("surfaces structured review reasons from proposal validation", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ status: "review-required", reasons: ["A confirmed generator is required."], questions: ["Which platform should this target?"] }), { status: 422, headers: { "content-type": "application/json" } }));
    await expect(api.generateBlueprintProposal("Build an app", "swift-spritekit")).rejects.toMatchObject({ message: "A confirmed generator is required. Which platform should this target?", status: 422 });
    expect(fetchMock).toHaveBeenCalled();
    fetchMock.mockRestore();
  });
});
