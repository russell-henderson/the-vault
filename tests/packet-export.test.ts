import { describe, expect, it } from "vitest";
import type { Blueprint } from "@the-vault/shared";
import { createVaultPacket, packetFilename } from "../apps/web/src/lib/packet-export";

const blueprint: Blueprint = {
  id: "blueprint-1", name: "AI Dashboard / Panel", description: "A dashboard panel.", targetPath: "src/Panel.tsx", language: "TypeScript", framework: "React", dependencies: [], architectureOverview: "Boundary", coreLogic: "Logic", layoutDesign: "UI", constraints: [], createdAt: "2026-07-15T00:00:00.000Z", updatedAt: "2026-07-15T00:00:00.000Z"
};

describe("packet export", () => {
  it("builds a full trace packet with empty optional artifacts supported", () => {
    const packet = createVaultPacket({ blueprint, executions: [] });
    expect(packet.schemaVersion).toBe(1);
    expect(packet.blueprint).toEqual(blueprint);
    expect(packet.promptArtifact).toBeNull();
    expect(packet.selectedExecution).toBeNull();
    expect(packet.executions).toEqual([]);
  });

  it("creates a safe slugged JSON filename", () => {
    expect(packetFilename("AI Dashboard / Panel")).toBe("ai-dashboard-panel-vault-packet.json");
    expect(packetFilename("!!!")).toBe("blueprint-vault-packet.json");
  });
});
