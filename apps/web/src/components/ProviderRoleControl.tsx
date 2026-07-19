import { useState } from "react";
import type { ProviderCatalog, ProviderSelection } from "@the-vault/shared";
import { ProviderModelSelect } from "./ProviderModelSelect";

export function ProviderRoleControl({ role, catalog, loading, selection, onChange, onRefresh }: { role: "analysis" | "creation"; catalog?: ProviderCatalog; loading: boolean; selection: ProviderSelection; onChange: (selection: ProviderSelection) => void; onRefresh: () => Promise<boolean> }) {
  const [feedback, setFeedback] = useState("");
  const configured = catalog?.configured[role];
  const option = catalog?.models.find((candidate) => candidate.provider === selection.provider && candidate.model === selection.model);
  const unavailable = selection.provider === "ollama" && (!option || !option.available);
  async function refresh() {
    setFeedback("");
    const refreshed = await onRefresh();
    setFeedback(refreshed ? "Catalog refreshed" : "Unable to refresh catalog");
  }
  return <div className="provider-role-control">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <ProviderModelSelect label={role === "analysis" ? "Analysis model" : "Creation model"} selection={selection} options={catalog?.models ?? []} loading={loading} onChange={(next) => { setFeedback(""); onChange(next); }} />
      <button className="button-secondary refresh-button" type="button" onClick={() => void refresh()} disabled={loading} aria-label="Refresh provider catalog" aria-busy={loading}>{loading ? <><span className="inline-spinner" /> Refreshing…</> : "↻ Refresh catalog"}</button>
    </div>
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500" aria-live="polite">
      {configured && <span>Configured provider: <span className="font-mono text-slate-400">{configured.provider}</span></span>}
      {unavailable && <span className="text-amber-200">Selected model is unavailable. Choose another model before running.</span>}
      {feedback && <span className={feedback.startsWith("Unable") ? "text-rose-200" : "text-emerald-200"}>{feedback}</span>}
    </div>
  </div>;
}
