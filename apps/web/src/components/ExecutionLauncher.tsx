import type { PromptArtifact } from "@the-vault/shared";

export function ExecutionLauncher({ prompt, launching, onLaunch }: { prompt?: PromptArtifact; launching: boolean; onLaunch: () => void }) {
  return <section className="panel flex flex-col justify-between gap-4 border-cyan-400/20 bg-cyan-400/[.04] p-5 sm:flex-row sm:items-center"><div><p className="eyebrow">AI provider boundary</p><h2 className="section-title">Ready for a controlled execution?</h2><p className="mt-1 text-sm text-slate-400">The local mock provider will produce a traceable result. No external AI request is made.</p></div><button className="button-primary shrink-0" disabled={!prompt || launching} onClick={onLaunch}>{launching ? "Running…" : "Launch execution →"}</button></section>;
}
