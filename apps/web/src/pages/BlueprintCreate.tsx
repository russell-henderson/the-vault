import type { BlueprintInput } from "@the-vault/shared";
import { useState } from "react";
import type { BlueprintProposal, ProviderStatus } from "@the-vault/shared";
import { BlueprintForm } from "../components/BlueprintForm";
import { BriefComposer } from "../components/BriefComposer";

export function BlueprintCreate({ onSubmit, onCancel, providerStatus }: { onSubmit: (input: BlueprintInput) => Promise<void>; onCancel: () => void; providerStatus?: ProviderStatus }) {
  const [manual, setManual] = useState(false);
  async function approve(proposal: BlueprintProposal) { await onSubmit(proposal.blueprint); }
  return <><div className="mb-8"><button className="back-link" onClick={onCancel}>← Back to blueprints</button><p className="eyebrow mt-8">Step 1 · Human intent</p><h1 className="page-title">Shape the work before it ships.</h1><p className="page-subtitle">Start with a brief and let local AI organize the architecture, or author every field yourself. Nothing executes until you review and approve the handoff.</p></div>{manual ? <BlueprintForm onSubmit={onSubmit} onCancel={onCancel} /> : <BriefComposer providerStatus={providerStatus} onApprove={approve} onManual={() => setManual(true)} onCancel={onCancel} />}</>;
}
