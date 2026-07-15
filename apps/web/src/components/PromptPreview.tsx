import type { PromptArtifact } from "@the-vault/shared";

export function PromptPreview({ prompt }: { prompt?: PromptArtifact }) {
  if (!prompt) return <div className="empty-panel"><span className="step-icon">02</span><div><h3 className="font-semibold text-white">No prompt generated yet</h3><p className="mt-1 text-sm text-slate-400">Generate a prompt when the specification is ready for Codex.</p></div></div>;
  return <section className="panel overflow-hidden"><div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div><p className="eyebrow">Prompt artifact</p><h2 className="section-title">Codex-ready context</h2></div><span className="tag">v{prompt.version}</span></div><pre className="max-h-[520px] overflow-auto whitespace-pre-wrap p-5 font-mono text-xs leading-6 text-slate-300">{prompt.generatedPrompt}</pre></section>;
}
