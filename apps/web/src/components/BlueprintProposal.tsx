import type { BlueprintProposal as BlueprintProposalData } from "@the-vault/shared";
import { ProviderStatus } from "./ProviderStatus";

export function BlueprintProposal({ proposal, onApprove, onEdit, saving }: { proposal: BlueprintProposalData; onApprove: () => Promise<void>; onEdit: () => void; saving: boolean }) {
  const { blueprint, plan, provider, warnings, classification, architecturePacket } = proposal;
  return <section className="proposal-shell panel">
    <div className="proposal-glow" />
    <div className="relative flex flex-col justify-between gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-start">
      <div><p className="eyebrow">AI proposal · human review required</p><h2 className="section-title text-2xl">{blueprint.name}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{blueprint.description}</p></div>
      <ProviderStatus status={{ configured: provider, available: true, detail: provider.message ?? "Proposal generated", fallbackAvailable: provider.name !== "mock" }} />
    </div>
    {classification && architecturePacket && <div className="relative grid gap-4 border-b border-white/10 p-6 sm:grid-cols-[.8fr_1.2fr]"><div><p className="meta-label">Intent classification</p><p className="mt-2 text-sm text-slate-200">{architecturePacket.stack.domainProfile} · <span className="font-mono text-cyan-200">{architecturePacket.stack.id}</span></p><p className="mt-2 text-xs text-slate-500">Confidence {Math.round(classification.evidence.confidence * 100)}% · {classification.evidence.classifierVersion}</p></div><div><p className="meta-label">Dynamic components</p><div className="mt-2 flex flex-wrap gap-2">{architecturePacket.components.map((component) => <span className="signal-pill" key={component.id}>{component.name}</span>)}</div></div></div>}
    <div className="relative grid gap-0 divide-y divide-white/10 lg:grid-cols-[1.1fr_.9fr] lg:divide-x lg:divide-y-0">
      <div className="space-y-6 p-6">
        <div><p className="meta-label">Architecture boundary</p><p className="mt-2 text-sm leading-6 text-slate-300">{blueprint.architectureOverview}</p></div>
        <div><p className="meta-label">Core behavior</p><p className="mt-2 text-sm leading-6 text-slate-300">{blueprint.coreLogic}</p></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><p className="meta-label">Target path</p><p className="meta-value font-mono text-cyan-200">{blueprint.targetPath}</p></div><div><p className="meta-label">Stack</p><p className="meta-value">{blueprint.framework} · {blueprint.language}</p></div></div>
        <div><p className="meta-label">Constraints</p><ul className="mt-2 space-y-2 text-sm text-slate-300">{blueprint.constraints.map((constraint) => <li className="flex gap-2" key={constraint}><span className="text-cyan-300">↳</span><span>{constraint}</span></li>)}</ul></div>
      </div>
      <div className="space-y-6 bg-slate-950/20 p-6">
        <div><p className="meta-label">Implementation packet</p><p className="mt-2 text-sm leading-6 text-slate-300">{plan.summary}</p></div>
        <div><p className="meta-label">Files to touch</p><div className="mt-2 space-y-2">{plan.filesToTouch.map((file) => <div className="file-pill" key={file}>{file}</div>)}</div></div>
        <div><p className="meta-label">Acceptance checks</p><ul className="mt-2 space-y-2 text-sm text-slate-300">{plan.acceptanceCriteria.map((criterion) => <li className="flex gap-2" key={criterion}><span className="check-mark">✓</span><span>{criterion}</span></li>)}</ul></div>
        {warnings.length > 0 && <div className="rounded-xl border border-amber-300/20 bg-amber-300/[.06] p-3 text-xs leading-5 text-amber-100"><p className="font-semibold uppercase tracking-wider text-amber-200">Review assumptions</p><ul className="mt-2 space-y-1">{warnings.map((warning) => <li key={warning}>• {warning}</li>)}</ul></div>}
      </div>
    </div>
    <div className="relative flex flex-col-reverse justify-end gap-3 border-t border-white/10 p-6 sm:flex-row"><button className="button-secondary" type="button" onClick={onEdit}>Edit manually</button><button className="button-primary" disabled={saving} type="button" onClick={() => void onApprove()}>{saving ? "Saving approved blueprint…" : "Approve & save blueprint →"}</button></div>
  </section>;
}
