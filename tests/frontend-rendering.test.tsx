import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Dashboard } from "../apps/web/src/pages/Dashboard";
import { PromptPreview } from "../apps/web/src/components/PromptPreview";
import { ProviderRoleControl } from "../apps/web/src/components/ProviderRoleControl";
import { MarkdownPreview } from "../apps/web/src/components/MarkdownPreview";
import { DocumentSelectGrid } from "../apps/web/src/components/DocumentSelectGrid";
import { BlueprintCard } from "../apps/web/src/components/BlueprintCard";
import { validateBlueprintCover } from "../apps/web/src/lib/blueprint-covers";
import { normalizeTag } from "@the-vault/shared";

describe("primary frontend workflow states", () => {
  it("renders the empty dashboard state and create action", () => {
    const html = renderToStaticMarkup(<Dashboard blueprints={[]} loading={false} onNavigate={() => undefined} />);
    expect(html).toContain("Your architecture vault is empty");
    expect(html).toContain("Create your first blueprint");
    expect(html).toContain("THE VAULT ARCHITECT");
    expect(html).toContain("[ LOCAL WORKSPACE ]");
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

  it("renders formatted markdown and document selection controls", () => {
    const markdown = renderToStaticMarkup(<MarkdownPreview markdown="# PRD\n\n## Scope\n\n- Keep the workflow bounded" />);
    expect(markdown).toContain("PRD");
    expect(markdown).toContain("Keep the workflow bounded");
    const grid = renderToStaticMarkup(<DocumentSelectGrid selected={["API.md"]} onChange={() => undefined} />);
    expect(grid).toContain("ARCHITECTURE.md");
    expect(grid).toContain("DATA_MODELS.md");
    expect(grid).toContain("COMPONENTS.md");
    expect(grid).toContain("DEVELOPMENT_PLAN.md");
    expect(grid).toContain("TESTING_STRATEGY.md");
    expect(grid).toContain('aria-pressed="true"');
  });

  it("renders the premium blueprint card footer and normalized tag treatment", () => {
    const html = renderToStaticMarkup(<BlueprintCard
      blueprint={{ id: "blueprint-1", name: "Analytics", description: "A dashboard", targetPath: "src/Analytics.tsx", language: "TypeScript", framework: "React", dependencies: ["fastify"], architectureOverview: "Boundary", coreLogic: "Render", layoutDesign: "Accessible", constraints: [], tags: ["product-design"], createdAt: "2026-07-18T00:00:00.000Z", updatedAt: "2026-07-18T00:00:00.000Z" }}
      isSelected={false} isManageMode={false} showMenu={false} isRenaming={false} renameValue="" isTagEditorOpen={false} newTagValue="" isDeleting={false}
      onCardClick={() => undefined} onToggleMenu={() => undefined} onStartRename={() => undefined} onStartTagEdit={() => undefined} onConfirmDelete={() => undefined} onStartDelete={() => undefined} onRenameValueChange={() => undefined} onRenameSubmit={() => undefined} onCancelRename={() => undefined} onTagValueChange={() => undefined} onAddTag={() => undefined} onCancelTagEdit={() => undefined} onRemoveTag={() => undefined}
    />);
    expect(html).toContain("#product-design");
    expect(html).toContain("1 dependencies");
    expect(html).toContain(new Date("2026-07-18T00:00:00.000Z").toLocaleDateString());
    expect(normalizeTag(" Product Design ")).toBe("product-design");
  });

  it("validates browser-local blueprint cover formats and size", () => {
    expect(validateBlueprintCover({ type: "image/webp", size: 200 } as File)).toBeUndefined();
    expect(validateBlueprintCover({ type: "image/gif", size: 200 } as File)).toContain("PNG, JPEG, or WebP");
    expect(validateBlueprintCover({ type: "image/png", size: 11 * 1024 * 1024 } as File)).toContain("10 MB");
  });
});
