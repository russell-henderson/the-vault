import type { PromptArtifact } from "@the-vault/shared";

export function ExecutionLauncher({ prompt, launching, onLaunch }: { prompt?: PromptArtifact; launching: boolean; onLaunch: () => void }) {
  return <section className="panel execution-launch flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"><div><p className="eyebrow">03 · Controlled execution</p><h2 className="section-title">Ready to make the packet real?</h2><p className="mt-1 text-sm text-slate-400">Run the configured local provider. The result stays attached to this exact prompt and blueprint.</p></div><button className="button-primary shrink-0" disabled={!prompt || launching} onClick={onLaunch}>{launching ? <><span className="inline-spinner" /> Running…</> : "Launch execution →"}</button></section>;
}
