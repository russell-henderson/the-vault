export type EphemeralModel = { id: string; label: string };

export type EphemeralProviderAdapter = {
  id: "ollama" | "openrouter";
  label: string;
  getAvailableModels: () => Promise<EphemeralModel[]>;
  streamGeneration: (input: { prompt: string; systemPrompt: string; model: string; onChunk: (chunk: string) => void; signal: AbortSignal }) => Promise<void>;
};

export class EphemeralProviderError extends Error {
  constructor(message: string) { super(message); this.name = "EphemeralProviderError"; }
}

export const EPHEMERAL_SYSTEM_PROMPT = "You are The Vault Architect. Create a practical, structured software architecture response. Preserve explicit user constraints, identify assumptions, and do not claim that data has been saved.";

export function buildEphemeralPrompt(brief: string): string {
  return ["Create an implementation-ready architecture brief for the following request.", "", brief.trim(), "", "Include: overview, user outcomes, architecture, data boundaries, implementation steps, tests, and unresolved questions."].join("\n");
}

export function buildEphemeralDocumentPrompt(filename: string, architecture: string): string {
  return [
    `Write the complete ${filename} document for the architecture below.`,
    "Use Markdown. Be concrete and internally consistent with the provided architecture. Do not mention this request, OAuth, ephemeral mode, or saving data.",
    "",
    "# Architecture context",
    architecture
  ].join("\n");
}

const ollamaBaseUrl = "http://127.0.0.1:11434";

async function responseError(response: Response, fallback: string): Promise<never> {
  const text = await response.text();
  throw new EphemeralProviderError(text || fallback);
}

async function streamLines(response: Response, onLine: (line: string) => void, signal: AbortSignal): Promise<void> {
  if (!response.body) throw new EphemeralProviderError("The generation stream did not include a response body.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (!signal.aborted) {
    const next = await reader.read();
    if (next.done) break;
    buffer += decoder.decode(next.value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) if (line.trim()) onLine(line.trim());
  }
  if (buffer.trim()) onLine(buffer.trim());
}

export const ollamaAdapter: EphemeralProviderAdapter = {
  id: "ollama",
  label: "Local Ollama",
  async getAvailableModels() {
    let response: Response;
    try { response = await fetch(`${ollamaBaseUrl}/api/tags`); }
    catch { throw new EphemeralProviderError("Ollama is not reachable at 127.0.0.1:11434. Start Ollama, then allow Local Network Access if Chromium asks."); }
    if (!response.ok) return responseError(response, "Ollama did not return its model list.");
    const payload = await response.json() as { models?: Array<{ name?: string }> };
    return (payload.models ?? []).flatMap((model) => typeof model.name === "string" ? [{ id: model.name, label: model.name }] : []);
  },
  async streamGeneration({ prompt, systemPrompt, model, onChunk, signal }) {
    let response: Response;
    try {
      response = await fetch(`${ollamaBaseUrl}/api/generate`, { method: "POST", headers: { "content-type": "application/json" }, signal, body: JSON.stringify({ model, prompt, system: systemPrompt, stream: true }) });
    } catch (error) {
      if (signal.aborted) return;
      throw new EphemeralProviderError(error instanceof Error && error.name === "AbortError" ? "Generation stopped." : "Ollama could not be reached. Check that it is running and that the browser allowed the local connection.");
    }
    if (!response.ok) return responseError(response, "Ollama could not start generation.");
    await streamLines(response, (line) => {
      try { const frame = JSON.parse(line) as { response?: unknown; error?: unknown }; if (typeof frame.error === "string") throw new EphemeralProviderError(frame.error); if (typeof frame.response === "string") onChunk(frame.response); }
      catch (error) { if (error instanceof EphemeralProviderError) throw error; }
    }, signal);
  }
};

type OpenRouterKeyResponse = { key?: unknown; data?: { key?: unknown } };
const oauthVerifierKey = "vault-ephemeral-openrouter-verifier";

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function createOAuthVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

async function sha256Base64Url(value: string): Promise<string> {
  return base64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
}

export async function startOpenRouterOAuth(): Promise<void> {
  const verifier = createOAuthVerifier();
  sessionStorage.setItem(oauthVerifierKey, verifier);
  const callbackUrl = `${window.location.origin}${window.location.pathname}`;
  const authorize = new URL("https://openrouter.ai/auth");
  authorize.searchParams.set("callback_url", callbackUrl);
  authorize.searchParams.set("code_challenge", await sha256Base64Url(verifier));
  authorize.searchParams.set("code_challenge_method", "S256");
  window.location.assign(authorize.toString());
}

export async function consumeOpenRouterOAuth(): Promise<string | undefined> {
  const code = new URLSearchParams(window.location.search).get("code");
  if (!code) return undefined;
  const verifier = sessionStorage.getItem(oauthVerifierKey);
  sessionStorage.removeItem(oauthVerifierKey);
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.hash || "#/ephemeral"}`);
  if (!verifier) throw new EphemeralProviderError("The OpenRouter authorization session expired. Please connect again.");
  let response: Response;
  try { response = await fetch("https://openrouter.ai/api/v1/auth/keys", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: "S256" }) }); }
  catch { throw new EphemeralProviderError("OpenRouter could not complete authorization. Check your connection and try again."); }
  if (!response.ok) return responseError(response, "OpenRouter rejected the authorization response.");
  const payload = await response.json() as OpenRouterKeyResponse;
  const key = typeof payload.key === "string" ? payload.key : typeof payload.data?.key === "string" ? payload.data.key : undefined;
  if (!key) throw new EphemeralProviderError("OpenRouter did not return a usable session key.");
  return key;
}

export function createOpenRouterAdapter(accessToken: string): EphemeralProviderAdapter {
  const headers = { authorization: `Bearer ${accessToken}`, "content-type": "application/json" };
  return {
    id: "openrouter",
    label: "OpenRouter",
    async getAvailableModels() {
      let response: Response;
      try { response = await fetch("https://openrouter.ai/api/v1/models", { headers: { authorization: headers.authorization } }); }
      catch { throw new EphemeralProviderError("OpenRouter model discovery failed. Check your connection and authorize again."); }
      if (!response.ok) return responseError(response, "OpenRouter did not return models.");
      const payload = await response.json() as { data?: Array<{ id?: string; name?: string }> };
      return (payload.data ?? []).flatMap((model) => typeof model.id === "string" ? [{ id: model.id, label: model.name ?? model.id }] : []);
    },
    async streamGeneration({ prompt, systemPrompt, model, onChunk, signal }) {
      let response: Response;
      try { response = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers, signal, body: JSON.stringify({ model, stream: true, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }] }) }); }
      catch (error) { if (signal.aborted) return; throw new EphemeralProviderError(error instanceof Error && error.name === "AbortError" ? "Generation stopped." : "OpenRouter could not start the generation stream."); }
      if (!response.ok) return responseError(response, "OpenRouter could not start generation.");
      await streamLines(response, (line) => {
        if (!line.startsWith("data:")) return;
        const value = line.slice(5).trim();
        if (value === "[DONE]") return;
        try { const frame = JSON.parse(value) as { choices?: Array<{ delta?: { content?: unknown } }> }; const chunk = frame.choices?.[0]?.delta?.content; if (typeof chunk === "string") onChunk(chunk); } catch { /* ignore non-content protocol frames */ }
      }, signal);
    }
  };
}
