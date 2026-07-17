import { useState } from "react";
import { copyMarkdown } from "../lib/clipboard";

export function CopyMarkdownButton({ markdown, disabled = false }: { markdown: string; disabled?: boolean }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() {
    if (disabled) return;
    try {
      await copyMarkdown(markdown);
      setState("copied");
      window.setTimeout(() => setState("idle"), 1800);
    } catch {
      setState("failed");
      window.setTimeout(() => setState("idle"), 2400);
    }
  }
  return <button className="button-secondary copy-button" type="button" disabled={disabled} onClick={() => void copy()} aria-label={state === "copied" ? "Markdown copied" : state === "failed" ? "Markdown copy failed" : "Copy Markdown"}>{state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy Markdown"}</button>;
}
