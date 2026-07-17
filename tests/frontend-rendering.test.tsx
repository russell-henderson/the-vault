import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Dashboard } from "../apps/web/src/pages/Dashboard";
import { PromptPreview } from "../apps/web/src/components/PromptPreview";
import { ProviderRoleControl } from "../apps/web/src/components/ProviderRoleControl";

describe("primary frontend workflow states", () => {
  it("renders the empty dashboard state and create action", () => {
    const html = renderToStaticMarkup(<Dashboard blueprints={[]} loading={false} onNavigate={() => undefined} />);
    expect(html).toContain("Your architecture vault is empty");
    expect(html).toContain("Create your first blueprint");
  });

  it("renders the generated prompt artifact state", () => {
    const html = renderToStaticMarkup(<PromptPreview prompt={{ id: "prompt-1", blueprintId: "blueprint-1", generatedPrompt: "# Codex Implementation Brief", version: 1, createdAt: "2026-07-15T00:00:00.000Z" }} />);
    expect(html).toContain("Codex-ready context");
    expect(html).toContain("Codex Implementation Brief");
    expect(html).toContain("Copy Markdown");
  });

  it("renders an accessible role selector and refresh control", () => {
    const html = renderToStaticMarkup(<ProviderRoleControl role="creation" loading={false} selection={{ provider: "ollama", model: "missing:latest" }} catalog={{ configured: { analysis: { provider: "mock", model: "deterministic-local" }, creation: { provider: "ollama", model: "dolphin3:8b" } }, models: [{ provider: "mock", model: "deterministic-local", label: "Deterministic mock", available: true, cloud: false }], ollamaAvailable: false, detail: "Ollama offline", refreshedAt: "2026-07-16T00:00:00.000Z" }} onChange={() => undefined} onRefresh={async () => true} />);
    expect(html).toContain('aria-label="Refresh provider catalog"');
    expect(html).toContain("Refresh catalog");
    expect(html).toContain("Selected model is unavailable");
  });
});
