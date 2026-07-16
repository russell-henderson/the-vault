import type { ProviderStatus as ProviderStatusData } from "@the-vault/shared";

export function ProviderStatus({ status, compact = false }: { status?: ProviderStatusData; compact?: boolean }) {
  if (!status) return <span className="provider-chip provider-chip-muted"><span className="provider-dot" />Checking local model</span>;
  const configured = status.configured;
  return <span className={`provider-chip ${status.available ? "provider-chip-ready" : "provider-chip-warn"}`} title={status.detail}>
    <span className="provider-dot" />
    <span>{configured.name === "ollama" ? "Ollama" : "Local mock"}</span>
    {!compact && <span className="provider-model">{status.models ? `${status.models.analysis} → ${status.models.creation}` : configured.model ?? "ready"}</span>}
  </span>;
}
