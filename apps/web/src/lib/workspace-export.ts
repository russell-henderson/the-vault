import type { WorkspaceDocument } from "@the-vault/shared";

function safeName(value: string): string { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "workspace"; }

function download(blob: Blob, filename: string): void {
  if (typeof document === "undefined" || typeof URL === "undefined") throw new Error("Downloads are unavailable in this environment.");
  const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}

export function downloadMarkdown(filename: string, content: string): void { download(new Blob([content], { type: "text/markdown;charset=utf-8" }), filename); }

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value: number): number[] { return [value & 0xff, (value >>> 8) & 0xff]; }
function u32(value: number): number[] { return [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]; }

export function createWorkspaceZip(files: Array<{ name: string; content: string }>): Uint8Array {
  const encoder = new TextEncoder(); const locals: number[][] = []; const central: number[][] = []; let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name); const data = encoder.encode(file.content); const crc = crc32(data);
    const local = [0x50, 0x4b, 0x03, 0x04, ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...name, ...data];
    locals.push(local);
    central.push([0x50, 0x4b, 0x01, 0x02, ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(offset), ...name]);
    offset += local.length;
  }
  const centralOffset = offset; const centralBytes = central.reduce((total, item) => total + item.length, 0); const end = [0x50, 0x4b, 0x05, 0x06, ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(centralBytes), ...u32(centralOffset), ...u16(0)];
  return Uint8Array.from([...locals.flat(), ...central.flat(), ...end]);
}

export function downloadWorkspaceZip(name: string, documents: WorkspaceDocument[]): void {
  const files = documents.filter((document) => document.status === "completed" && document.content.trim()).map((document) => ({ name: document.filename, content: document.content }));
  if (files.length === 0) throw new Error("There are no generated documents to export.");
  download(new Blob([createWorkspaceZip(files)], { type: "application/zip" }), `${safeName(name)}-documents.zip`);
}

import JSZip from "jszip";
import { saveAs } from "file-saver";
import { api } from "./api";

export async function exportBulkBlueprintsAsZip(blueprintIds: string[]): Promise<void> {
  const zip = new JSZip();

  for (const id of blueprintIds) {
    try {
      const workspace = await api.getWorkspace(id);
      const bp = workspace.blueprint;
      const folderName = bp.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-") || bp.id;
      const bpFolder = zip.folder(folderName);

      if (bpFolder) {
        const metadata = [
          `# ${bp.name}`,
          "",
          `## Description`,
          bp.description,
          "",
          `## Scope & Goals`,
          bp.architectureOverview,
          "",
          `## Target Audience & Use Cases`,
          bp.coreLogic,
          "",
          `## Technical Stack`,
          `- Framework: ${bp.framework}`,
          `- Language: ${bp.language}`,
          `- Target Path: ${bp.targetPath}`,
          "",
          `## Dependencies`,
          (bp.dependencies || []).map(d => `- ${d}`).join("\n"),
          "",
          `## Constraints`,
          (bp.technicalConstraints || []).map(c => `- ${c}`).join("\n"),
          "",
          `## Tags`,
          (bp.tags || []).map(t => `- ${t}`).join("\n")
        ].join("\n");
        bpFolder.file("blueprint-metadata.md", metadata);

        for (const doc of workspace.documents) {
          if (doc.status === "completed" && doc.content.trim()) {
            bpFolder.file(doc.filename, doc.content);
          }
        }
      }
    } catch (err) {
      console.error(`Failed to export blueprint ${id} in bulk zip`, err);
    }
  }

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `vault-bulk-export-${new Date().toISOString().split("T")[0]}.zip`);
}

