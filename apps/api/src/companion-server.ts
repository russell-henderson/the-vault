import { randomBytes } from "node:crypto";
import { buildApp } from "./app.js";
import { VaultRepository } from "./repository.js";
import { MockAiProvider } from "./providers/mock-provider.js";
import { OllamaAiProvider } from "./providers/ollama-provider.js";

export const productionOrigin = "https://the-vault-dusky.vercel.app";

export type StartedCompanion = { port: number; token: string; expiresAt: number; close: () => Promise<void> };

export async function startCompanion(options: { databasePath: string; ttlMs?: number; openBrowser: (url: string) => void; provider?: "ollama" | "mock" }): Promise<StartedCompanion> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + (options.ttlMs ?? 15 * 60 * 1000);
  const provider = options.provider === "mock" ? new MockAiProvider(true) : new OllamaAiProvider("http://127.0.0.1:11434");
  const app = buildApp(new VaultRepository(options.databasePath), provider, { companionSecurity: { allowedOrigin: productionOrigin, token, expiresAt } });
  await app.listen({ port: 0, host: "127.0.0.1" });
  const address = app.server.address();
  if (!address || typeof address === "string") { await app.close(); throw new Error("Companion did not receive a loopback port"); }
  const endpoint = `http://127.0.0.1:${address.port}`;
  options.openBrowser(`${productionOrigin}/#/connect?endpoint=${encodeURIComponent(endpoint)}&token=${encodeURIComponent(token)}`);
  return { port: address.port, token, expiresAt, close: () => app.close() };
}
