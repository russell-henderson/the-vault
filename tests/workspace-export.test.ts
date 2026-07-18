import { describe, expect, it } from "vitest";
import { createWorkspaceZip } from "../apps/web/src/lib/workspace-export";

describe("workspace ZIP export", () => {
  it("creates a store-only ZIP with each requested Markdown file", () => {
    const zip = createWorkspaceZip([{ name: "PRD.md", content: "# PRD" }, { name: "API.md", content: "# API" }]);
    const header = new TextDecoder().decode(zip.slice(0, 4));
    expect(Array.from(zip.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(header).toBe("PK\u0003\u0004");
    expect(new TextDecoder().decode(zip)).toContain("PRD.md");
    expect(new TextDecoder().decode(zip)).toContain("API.md");
  });
});
