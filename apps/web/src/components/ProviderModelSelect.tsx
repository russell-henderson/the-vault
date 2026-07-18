import type { ProviderModelOption, ProviderSelection } from "@the-vault/shared";

export function ProviderModelSelect({ label, selection, options, loading, onChange }: { label: string; selection: ProviderSelection; options: ProviderModelOption[]; loading: boolean; onChange: (selection: ProviderSelection) => void }) {
  const value = `${selection.provider}:${selection.model ?? ""}`;
  const selectedOption = options.find((option) => `${option.provider}:${option.model}` === value);
  const baseOptions = options.some((option) => option.provider === "mock") ? options : [...options, { provider: "mock" as const, model: "deterministic-local", label: "Deterministic mock", available: true, cloud: false }];

  // Filter models to only allow: deepseek-r1, dolphin3, llama3.2, and phi4-mini
  const allowedPrefixes = ["deepseek-r1", "dolphin3", "llama3.2", "phi4-mini"];
  const filteredBaseOptions = baseOptions.filter(
    (option) =>
      option.provider === "mock" ||
      allowedPrefixes.some((p) => option.model.toLowerCase().includes(p))
  );

  const visibleOptions = !selectedOption
    ? [...filteredBaseOptions, ...(selection.model && !filteredBaseOptions.some((option) => `${option.provider}:${option.model}` === value) ? [{ provider: selection.provider, model: selection.model, label: `${selection.model} (unavailable)`, available: false, cloud: selection.model.toLowerCase().split(":").includes("cloud") }] : [])]
    : filteredBaseOptions;

  return <label className="provider-select"><span>{label}</span><select aria-label={label} value={value} disabled={loading && options.length === 0} onChange={(event) => {
    const [provider, ...modelParts] = event.target.value.split(":");
    onChange({ provider: provider as ProviderSelection["provider"], model: modelParts.join(":") });
  }}>
    {loading && visibleOptions.length === 0 && <option value={value}>Loading catalog…</option>}
    {!loading && visibleOptions.length === 0 && <option value={value}>No provider models found</option>}
    {visibleOptions.map((option) => <option key={`${option.provider}:${option.model}`} value={`${option.provider}:${option.model}`} disabled={!option.available}>{option.provider === "mock" ? option.label : `Ollama · ${option.label}`}{!option.available ? " (unavailable)" : ""}</option>)}
  </select></label>;
}
