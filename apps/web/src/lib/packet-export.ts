import type { Blueprint, ExecutionRecord, PromptArtifact } from "@the-vault/shared";
import type { ExecutionDetails } from "./api";

export type VaultPacketExport = {
  schemaVersion: 1;
  exportedAt: string;
  blueprint: Blueprint;
  promptArtifact: PromptArtifact | null;
  executions: ExecutionRecord[];
  selectedExecution: ExecutionDetails | null;
};

export function createVaultPacket(input: { blueprint: Blueprint; prompt?: PromptArtifact; executions: ExecutionRecord[]; selectedExecution?: ExecutionDetails }): VaultPacketExport {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    blueprint: input.blueprint,
    promptArtifact: input.prompt ?? null,
    executions: input.executions,
    selectedExecution: input.selectedExecution ?? null
  };
}

export function packetFilename(name: string): string {
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${slug || "blueprint"}-vault-packet.json`;
}

export function downloadVaultPacket(packet: VaultPacketExport): void {
  if (typeof document === "undefined" || typeof URL === "undefined") throw new Error("Packet downloads are unavailable in this environment.");
  const blob = new Blob([JSON.stringify(packet, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = packetFilename(packet.blueprint.name);
  link.click();
  URL.revokeObjectURL(url);
}
