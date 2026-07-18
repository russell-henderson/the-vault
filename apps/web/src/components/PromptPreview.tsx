import type { PromptArtifact } from "@the-vault/shared";
import { CopyMarkdownButton } from "./CopyMarkdownButton";
import { MarkdownPreview } from "./MarkdownPreview";

export function PromptPreview({ prompt }: { prompt?: PromptArtifact }) {
  if (!prompt) return <div className="empty-panel"><span className="step-icon">02</span><div><h3 className="font-semibold text-white">No prompt generated yet</h3><p className="mt-1 text-sm text-slate-400">Generate a prompt when the specification is ready for Codex.</p></div></div>;
  return <section className="panel overflow-hidden"><div className="border-b border-white/10 px-5 py-4"><div className="flex items-center justify-between gap-4"><div><p className="eyebrow">02 · Prepare</p><h2 className="section-title">Codex-ready context</h2></div><div className="flex items-center gap-3"><span className="tag">v{prompt.version}</span><CopyMarkdownButton markdown={prompt.generatedPrompt} /></div></div>{prompt.contextSummary && <div className="context-summary"><MarkdownPreview markdown={prompt.contextSummary} /></div>}</div><details className="border-t border-white/10"><summary className="cursor-pointer px-5 py-3 text-xs font-semibold uppercase tracking-[.14em] text-slate-400">View parser-ready payload</summary><pre className="max-h-[420px] overflow-auto border-t border-white/10 p-5 font-mono text-xs leading-6 text-slate-300">{prompt.generatedPrompt}</pre></details></section>;
}
