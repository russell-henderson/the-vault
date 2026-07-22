import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { createWorkspaceZip } from "../apps/web/src/lib/workspace-export";

describe("workspace ZIP export", () => {
  it("creates an extractable ZIP with each requested Markdown file", async () => {
    const zip = createWorkspaceZip([{ name: "PRD.md", content: "# PRD" }, { name: "API.md", content: "# API" }]);
    const archive = await JSZip.loadAsync(zip);

    expect(Object.keys(archive.files)).toEqual(["PRD.md", "API.md"]);
    expect(await archive.file("PRD.md")?.async("text")).toBe("# PRD");
    expect(await archive.file("API.md")?.async("text")).toBe("# API");
  });
});
