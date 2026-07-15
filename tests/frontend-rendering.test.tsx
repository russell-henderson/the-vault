import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Dashboard } from "../apps/web/src/pages/Dashboard";
import { PromptPreview } from "../apps/web/src/components/PromptPreview";

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
  });
});
