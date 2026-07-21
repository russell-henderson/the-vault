import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../apps/api/src/app";
import { MockAiProvider } from "../apps/api/src/providers/mock-provider";
import { VaultRepository } from "../apps/api/src/repository";

const origin = "https://the-vault-dusky.vercel.app";
const security = { allowedOrigin: origin, token: "pairing-token", expiresAt: Date.now() + 60_000 };

describe("companion API security", () => {
  const apps: Array<ReturnType<typeof buildApp>> = [];
  afterEach(async () => { await Promise.all(apps.splice(0).map((app) => app.close())); });
  function app() { const instance = buildApp(new VaultRepository(":memory:"), new MockAiProvider(true), { companionSecurity: security }); apps.push(instance); return instance; }

  it("requires the exact Vercel origin and bearer token before API handlers", async () => {
    const instance = app();
    expect((await instance.inject({ method: "GET", url: "/api/providers/status" })).statusCode).toBe(403);
    expect((await instance.inject({ method: "GET", url: "/api/providers/status", headers: { origin } })).statusCode).toBe(401);
    expect((await instance.inject({ method: "GET", url: "/api/providers/status", headers: { origin: "https://evil.example", authorization: "Bearer pairing-token" } })).statusCode).toBe(403);
    const response = await instance.inject({ method: "GET", url: "/api/connection-info", headers: { origin, authorization: "Bearer pairing-token" } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ contractVersion: 1, authentication: "bearer-required", providers: { localOnly: true } });
  });

  it("protects disk synchronization and supports approved preflight", async () => {
    const instance = app();
    const preflight = await instance.inject({ method: "OPTIONS", url: "/api/blueprints/id/sync-to-disk", headers: { origin, "access-control-request-method": "POST" } });
    expect(preflight.statusCode).toBe(204);
    expect(preflight.headers["access-control-allow-origin"]).toBe(origin);
    const response = await instance.inject({ method: "POST", url: "/api/blueprints/id/sync-to-disk", headers: { origin }, payload: { targetPath: "C:\\tmp", files: [] } });
    expect(response.statusCode).toBe(401);
  });

  it("rejects an expired pairing session", async () => {
    const instance = buildApp(new VaultRepository(":memory:"), new MockAiProvider(true), { companionSecurity: { ...security, expiresAt: Date.now() - 1 } });
    apps.push(instance);
    const response = await instance.inject({ method: "GET", url: "/api/providers/status", headers: { origin, authorization: "Bearer pairing-token" } });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ error: "Pairing session expired" });
  });
});
