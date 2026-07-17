import type { ProviderCatalog, ProviderStatus as ProviderStatusData } from "@the-vault/shared";

export function ProviderStatus({ status, catalog, compact = false }: { status?: ProviderStatusData; catalog?: ProviderCatalog; compact?: boolean }) {
  if (!status) return <span className="provider-chip provider-chip-muted"><span className="provider-dot" />Checking local model</span>;
  const configured = status.configured;
  return <span className={`provider-chip ${status.available ? "provider-chip-ready" : "provider-chip-warn"}`} title={`${status.detail}${catalog ? ` · Ollama ${catalog.ollamaAvailable ? "available" : "unavailable"}` : ""}`}>
    <span className="provider-dot" />
    <span>{configured.name === "ollama" ? "Ollama" : "Local mock"}</span>
    {!compact && <span className="provider-model">{status.models ? `${status.models.analysis} → ${status.models.creation}` : configured.model ?? "ready"}</span>}
    {!compact && catalog?.refreshedAt && <span className="provider-model" title={catalog.detail}>· refreshed {new Date(catalog.refreshedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>}
    {!compact && catalog && <span className="provider-model">· Ollama {catalog.ollamaAvailable ? "ready" : "offline"}</span>}
  </span>;
}
