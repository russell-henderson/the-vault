import { useState } from "react";
import type { ProviderModelOption } from "@the-vault/shared";
import { api } from "../lib/api";

export function EmbeddingModelProbe({ options, loading }: { options: ProviderModelOption[]; loading: boolean }) {
  const [model, setModel] = useState("");
  const [text, setText] = useState("What is in this image?");
  const [imageUrl, setImageUrl] = useState("");
  const [result, setResult] = useState<{ model: string; dimensions: number; preview: number[] }>();
  const [error, setError] = useState("");
  const selected = options.find((option) => option.model === model);

  async function test() {
    if (!model || !text.trim()) return;
    setError("");
    setResult(undefined);
    try {
      const response = await api.testEmbedding({ model, text, ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}) });
      setResult(response);
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : "Embedding test failed.");
    }
  }

  return <section className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4" aria-label="Embedding model evaluation">
    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
      <div>
        <p className="eyebrow">Embedding evaluation</p>
        <p className="mt-1 text-xs text-slate-400">Choose an embedding model separately from text-generation models.</p>
      </div>
      <label className="provider-select md:min-w-[20rem]"><span>Embedding model</span><select aria-label="Embedding model" value={model} disabled={loading || options.length === 0} onChange={(event) => setModel(event.target.value)}>
        <option value="">Choose an embedding model…</option>
        {options.map((option) => <option key={`${option.provider}:${option.model}`} value={option.model} disabled={!option.available}>{option.provider} · {option.label}{!option.available ? " (set OPENROUTER_API_KEY)" : ""}</option>)}
      </select></label>
    </div>
    <div className="mt-3 grid gap-3 md:grid-cols-2">
      <label className="provider-select"><span>Text input</span><input value={text} onChange={(event) => setText(event.target.value)} placeholder="Text to embed" /></label>
      <label className="provider-select"><span>Image URL (optional)</span><input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://…" /></label>
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button className="button-secondary" type="button" disabled={!selected?.available || !text.trim()} onClick={() => void test()}>Test selected embedding →</button>
      {result && <span className="text-xs text-emerald-200">{result.model} · {result.dimensions} dimensions · preview [{result.preview.join(", ")}]</span>}
      {error && <span className="text-xs text-rose-200" role="alert">{error}</span>}
    </div>
  </section>;
}
