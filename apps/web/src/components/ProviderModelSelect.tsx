import { useEffect } from "react";
import type { ProviderModelOption, ProviderSelection } from "@the-vault/shared";

export function ProviderModelSelect({ label, selection, options, loading, onChange }: { label: string; selection: ProviderSelection; options: ProviderModelOption[]; loading: boolean; onChange: (selection: ProviderSelection) => void }) {
  const removedModel = selection.provider === "ollama" && selection.model?.toLowerCase().startsWith("phi4-mini");
  useEffect(() => {
    if (removedModel) onChange({ provider: "ollama" });
  }, [onChange, removedModel]);
  const effectiveSelection = removedModel ? { provider: "ollama" as const } : selection;
  const value = `${effectiveSelection.provider}:${effectiveSelection.model ?? ""}`;
  const selectedOption = options.find((option) => `${option.provider}:${option.model}` === value);
  const baseOptions = options.some((option) => option.provider === "mock") ? options : [...options, { provider: "mock" as const, model: "deterministic-local", label: "Deterministic mock", available: true, cloud: false }];

  // Keep local generation choices bounded while allowing every Ollama cloud model returned by the server.
  const allowedPrefixes = ["deepseek-r1", "dolphin3", "llama3.2"];
  const filteredBaseOptions = baseOptions.filter(
    (option) =>
      option.capability !== "embedding" && (option.provider === "mock" || option.cloud || allowedPrefixes.some((p) => option.model.toLowerCase().includes(p)))
  );

  const visibleOptions = !selectedOption
    ? [...filteredBaseOptions, ...(selection.model && !filteredBaseOptions.some((option) => `${option.provider}:${option.model}` === value) ? [{ provider: selection.provider, model: selection.model, label: `${selection.model} (unavailable)`, available: false, cloud: selection.model.toLowerCase().split(":").includes("cloud") }] : [])]
    : filteredBaseOptions;

  return <label className="provider-select"><span>{label}</span><select aria-label={label} value={value} disabled={loading && options.length === 0} onChange={(event) => {
    const [provider, ...modelParts] = event.target.value.split(":");
    const model = modelParts.join(":");
    onChange({ provider: provider as ProviderSelection["provider"], ...(model ? { model } : {}) });
  }}>
    <option value={`${effectiveSelection.provider}:`}>Choose a model…</option>
    {loading && visibleOptions.length === 0 && <option value={value}>Loading catalog…</option>}
    {!loading && visibleOptions.length === 0 && <option value={value}>No provider models found</option>}
    {visibleOptions.map((option) => <option key={`${option.provider}:${option.model}`} value={`${option.provider}:${option.model}`} disabled={!option.available}>{option.provider === "mock" ? option.label : `${option.provider === "openrouter" ? "OpenRouter" : "Ollama"} · ${option.label}${option.cloud ? " · cloud" : ""}`}{!option.available ? " (unavailable)" : ""}</option>)}
  </select></label>;
}
