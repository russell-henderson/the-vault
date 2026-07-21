import { describe, expect, it, vi } from "vitest";
import { EPHEMERAL_SYSTEM_PROMPT, buildEphemeralDocumentPrompt, buildEphemeralPrompt, consumeOpenRouterOAuth, createOAuthVerifier, createOpenRouterAdapter, ollamaAdapter } from "../apps/web/src/lib/ephemeral.js";

describe("ephemeral browser providers", () => {
  it("builds an explicit no-save generation prompt", () => {
    expect(buildEphemeralPrompt("Create a TypeScript dashboard.")).toContain("Create a TypeScript dashboard.");
    expect(EPHEMERAL_SYSTEM_PROMPT).toContain("do not claim that data has been saved");
    expect(buildEphemeralDocumentPrompt("API.md", "Architecture details")).toContain("Architecture details");
  });

  it("creates a high-entropy URL-safe OAuth verifier", () => {
    const first = createOAuthVerifier();
    const second = createOAuthVerifier();
    expect(first).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(second).not.toBe(first);
  });

  it("discovers Ollama models without a Vault API request", async () => {
    const fetchStub = vi.fn().mockResolvedValue(new Response(JSON.stringify({ models: [{ name: "llama3.2:3b" }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchStub);
    await expect(ollamaAdapter.getAvailableModels()).resolves.toEqual([{ id: "llama3.2:3b", label: "llama3.2:3b" }]);
    expect(fetchStub).toHaveBeenCalledWith("http://127.0.0.1:11434/api/tags");
    vi.unstubAllGlobals();
  });

  it("sends OpenRouter credentials only to OpenRouter", async () => {
    const fetchStub = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [{ id: "openai/gpt-4o-mini", name: "GPT-4o mini" }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchStub);
    const models = await createOpenRouterAdapter("ephemeral-key").getAvailableModels();
    expect(models[0]?.id).toBe("openai/gpt-4o-mini");
    expect(fetchStub).toHaveBeenCalledWith("https://openrouter.ai/api/v1/models", { headers: { authorization: "Bearer ephemeral-key" } });
    vi.unstubAllGlobals();
  });

  it("uses the same S256 PKCE method when exchanging an authorization code", async () => {
    const storage = new Map<string, string>([["vault-ephemeral-openrouter-verifier", "verifier"]]);
    vi.stubGlobal("window", { location: { search: "?code=callback-code", pathname: "/", hash: "#/ephemeral" }, history: { replaceState: vi.fn() } });
    vi.stubGlobal("sessionStorage", { getItem: (key: string) => storage.get(key) ?? null, removeItem: (key: string) => storage.delete(key) });
    const fetchStub = vi.fn().mockResolvedValue(new Response(JSON.stringify({ key: "memory-only-key" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchStub);
    await expect(consumeOpenRouterOAuth()).resolves.toBe("memory-only-key");
    expect(fetchStub).toHaveBeenCalledWith("https://openrouter.ai/api/v1/auth/keys", expect.objectContaining({ body: JSON.stringify({ code: "callback-code", code_verifier: "verifier", code_challenge_method: "S256" }) }));
    expect(storage.has("vault-ephemeral-openrouter-verifier")).toBe(false);
    vi.unstubAllGlobals();
  });
});
