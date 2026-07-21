import { useEffect, useMemo, useRef, useState } from "react";
import type { CoreDocumentFilename } from "@the-vault/shared";
import { DocumentSelectGrid } from "../components/DocumentSelectGrid";
import { EPHEMERAL_SYSTEM_PROMPT, buildEphemeralDocumentPrompt, buildEphemeralPrompt, consumeOpenRouterOAuth, createOpenRouterAdapter, ollamaAdapter, startOpenRouterOAuth, type EphemeralModel, type EphemeralProviderAdapter } from "../lib/ephemeral";
import { createWorkspaceZip, downloadMarkdown } from "../lib/workspace-export";

type ProviderKind = "ollama" | "openrouter";
type EphemeralDocument = { content: string; status: "completed" | "generating" | "failed"; error?: string };

export function Ephemeral({ onOpenSavedMode }: { onOpenSavedMode: () => void }) {
  const [providerKind, setProviderKind] = useState<ProviderKind>("ollama");
  const [openRouterToken, setOpenRouterToken] = useState<string>();
  const [existingOpenRouterKey, setExistingOpenRouterKey] = useState("");
  const [models, setModels] = useState<EphemeralModel[]>([]);
  const [model, setModel] = useState("");
  const [manualModel, setManualModel] = useState("");
  const [modelRefresh, setModelRefresh] = useState(0);
  const [brief, setBrief] = useState("");
  const [output, setOutput] = useState("");
  const [selectedDocuments, setSelectedDocuments] = useState<CoreDocumentFilename[]>(["API.md", "DATA_MODELS.md", "COMPONENTS.md", "DEVELOPMENT_PLAN.md", "TESTING_STRATEGY.md", "DEPLOYMENT.md"]);
  const [documents, setDocuments] = useState<Record<string, EphemeralDocument>>({});
  const [activeDocument, setActiveDocument] = useState<string>();
  const [message, setMessage] = useState("");
  const [loadingModels, setLoadingModels] = useState(false);
  const [generating, setGenerating] = useState(false);
  const controller = useRef<AbortController>();
  const adapter = useMemo<EphemeralProviderAdapter | undefined>(() => providerKind === "ollama" ? ollamaAdapter : openRouterToken ? createOpenRouterAdapter(openRouterToken) : undefined, [providerKind, openRouterToken]);

  useEffect(() => {
    void consumeOpenRouterOAuth().then((token) => { if (token) { setOpenRouterToken(token); setProviderKind("openrouter"); setMessage("OpenRouter connected for this tab."); } }).catch((error) => setMessage(error instanceof Error ? error.message : "OpenRouter authorization failed."));
  }, []);

  useEffect(() => {
    setModels([]); setModel(""); setManualModel("");
    if (!adapter) return;
    setLoadingModels(true); setMessage("");
    void adapter.getAvailableModels().then((available) => { setModels(available); setModel(available[0]?.id ?? ""); if (available.length === 0) setMessage("No models are available for this provider."); }).catch((error) => setMessage(error instanceof Error ? error.message : "Unable to list models.")).finally(() => setLoadingModels(false));
  }, [adapter, modelRefresh]);

  async function generate() {
    if (!adapter) { setMessage("Connect OpenRouter before selecting it."); return; }
    if (!model) { setMessage("Select a model before generating."); return; }
    if (!brief.trim()) { setMessage("Describe the software you want to design."); return; }
    controller.current?.abort(); const next = new AbortController(); controller.current = next;
    setOutput(""); setMessage(""); setGenerating(true);
    try { await adapter.streamGeneration({ model, prompt: buildEphemeralPrompt(brief), systemPrompt: EPHEMERAL_SYSTEM_PROMPT, signal: next.signal, onChunk: (chunk) => setOutput((current) => current + chunk) }); }
    catch (error) { if (!next.signal.aborted) setMessage(error instanceof Error ? error.message : "Generation failed."); }
    finally { if (controller.current === next) controller.current = undefined; setGenerating(false); }
  }

  function connectExistingOpenRouterKey() {
    const key = existingOpenRouterKey.trim();
    if (!key) { setMessage("Paste an OpenRouter API key to connect this tab."); return; }
    setOpenRouterToken(key); setExistingOpenRouterKey(""); setMessage("OpenRouter key connected for this tab. Loading models…");
  }

  async function generateDocuments() {
    if (!adapter || !model || !output) return;
    controller.current?.abort(); const next = new AbortController(); controller.current = next;
    setMessage(""); setGenerating(true); setDocuments({ "ARCHITECTURE.md": { content: output, status: "completed" } });
    try {
      for (const filename of selectedDocuments) {
        if (next.signal.aborted) return;
        setActiveDocument(filename); setDocuments((current) => ({ ...current, [filename]: { content: "", status: "generating" } }));
        let content = "";
        try {
          await adapter.streamGeneration({ model, prompt: buildEphemeralDocumentPrompt(filename, output), systemPrompt: EPHEMERAL_SYSTEM_PROMPT, signal: next.signal, onChunk: (chunk) => { content += chunk; setDocuments((current) => ({ ...current, [filename]: { content, status: "generating" } })); } });
          setDocuments((current) => ({ ...current, [filename]: { content, status: "completed" } }));
        } catch (error) {
          if (next.signal.aborted) return;
          setDocuments((current) => ({ ...current, [filename]: { content, status: "failed", error: error instanceof Error ? error.message : "Generation failed" } }));
        }
      }
      setMessage("Document workspace generated in memory. Download it before refreshing the page.");
    } finally { if (controller.current === next) controller.current = undefined; setActiveDocument(undefined); setGenerating(false); }
  }

  function downloadWorkspace() {
    const files = Object.entries(documents).filter(([, document]) => document.status === "completed" && document.content.trim()).map(([name, document]) => ({ name, content: document.content }));
    if (files.length === 0) { setMessage("Generate at least one document before exporting."); return; }
    const blob = new Blob([createWorkspaceZip(files)], { type: "application/zip" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "vault-ephemeral-documents.zip"; anchor.click(); URL.revokeObjectURL(url);
  }

  return <main className="mx-auto min-h-screen max-w-5xl px-6 py-12 text-slate-100">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">THE VAULT ARCHITECT</p><h1 className="page-title mt-3">Generate an architecture locally</h1><p className="page-subtitle mt-3">Choose a provider, generate, and download. Nothing is saved to a Vault database.</p></div><button className="button-secondary" onClick={onOpenSavedMode}>Saved API / Companion mode</button></div>
    <div className="mt-6 inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm text-amber-100">Ephemeral Mode — data is in memory only and will not be saved.</div>
    <section className="panel mt-6 grid gap-6 p-6 lg:grid-cols-[18rem_1fr]"><aside className="space-y-4"><label className="provider-select"><span>Provider</span><select value={providerKind} onChange={(event) => setProviderKind(event.target.value as ProviderKind)}><option value="ollama">Local Ollama</option><option value="openrouter">OpenRouter</option></select></label>
      {providerKind === "openrouter" && !openRouterToken && <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-950/40 p-3"><button className="button-primary w-full" onClick={() => void startOpenRouterOAuth()}>Connect OpenRouter with OAuth</button><p className="text-xs leading-5 text-slate-400">If OAuth does not return a session, use an existing OpenRouter API key for this tab only.</p><label className="provider-select"><span>Existing OpenRouter API key</span><input type="password" value={existingOpenRouterKey} onChange={(event) => setExistingOpenRouterKey(event.target.value)} placeholder="sk-or-v1-…" autoComplete="off" /></label><button className="button-secondary w-full" onClick={connectExistingOpenRouterKey}>Use existing key</button></div>}
      <label className="provider-select"><span>Model</span><select disabled={!adapter || loadingModels || models.length === 0} value={model} onChange={(event) => setModel(event.target.value)}><option value="">{loadingModels ? "Loading models…" : "Select a model"}</option>{models.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
      {providerKind === "openrouter" && openRouterToken && !loadingModels && models.length === 0 && <label className="provider-select"><span>OpenRouter model ID</span><input value={manualModel} onChange={(event) => { setManualModel(event.target.value); setModel(event.target.value.trim()); }} placeholder="openrouter/auto" autoComplete="off" /><small className="normal-case tracking-normal text-slate-500">Use this when the model catalog cannot load. Enter a model ID from your OpenRouter setup.</small></label>}
      {providerKind === "ollama" && !loadingModels && models.length === 0 && <label className="provider-select"><span>Local Ollama model ID</span><input value={manualModel} onChange={(event) => { setManualModel(event.target.value); setModel(event.target.value.trim()); }} placeholder="llama3.2:3b" autoComplete="off" /><small className="normal-case tracking-normal text-slate-500">Use any model shown by <code>ollama list</code> if the browser cannot load the catalog.</small></label>}
      {providerKind === "ollama" && <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3 text-xs leading-5 text-slate-400"><div className="flex items-center justify-between gap-3"><p className="font-semibold text-slate-300">Ollama connection help</p><button className="button-secondary px-2 py-1 text-xs" disabled={loadingModels} onClick={() => setModelRefresh((current) => current + 1)}>Retry local models</button></div><p className="mt-1">The picker lists every model returned by your local Ollama service. If the browser blocks the loopback request, restart Ollama with:</p><code className="mt-2 block break-all text-cyan-200">OLLAMA_ORIGINS=&quot;https://the-vault-dusky.vercel.app&quot; ollama serve</code><code className="mt-2 block break-all text-cyan-200">$env:OLLAMA_ORIGINS=&quot;https://the-vault-dusky.vercel.app&quot;; ollama serve</code><p className="mt-2">Allow Chromium Local Network Access when prompted. You can also enter an installed model ID above.</p></div>}
    </aside><div className="space-y-4"><label className="provider-select"><span>Architecture brief</span><textarea className="brief-input" rows={10} value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="Describe the outcome, users, preferred stack, and constraints…" /></label><div className="flex flex-wrap gap-3"><button className="button-primary" disabled={generating} onClick={() => void generate()}>{generating ? "Generating…" : "Generate architecture"}</button>{generating && <button className="button-secondary" onClick={() => controller.current?.abort()}>Stop</button>}{output && <button className="button-secondary" onClick={() => downloadMarkdown("ARCHITECTURE.md", output)}>Download Architecture</button>}</div>{message && <p role="alert" className="text-sm text-amber-200">{message}</p>}{output && <article className="rounded-xl border border-slate-700 bg-slate-950/50 p-5 whitespace-pre-wrap text-sm leading-7 text-slate-200">{output}</article>}</div></section>
    {output && <section className="mt-6 space-y-5"><DocumentSelectGrid selected={selectedDocuments} onChange={setSelectedDocuments} /><div className="panel space-y-4 p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="section-title">Ephemeral document workspace</h2><p className="mt-1 text-sm text-slate-400">Uses the generated architecture as context. Documents remain in memory and are never sent to the Vault API.</p></div><div className="flex flex-wrap gap-3"><button className="button-primary" disabled={generating || selectedDocuments.length === 0} onClick={() => void generateDocuments()}>{generating ? `Generating ${activeDocument ?? "…"}` : "Generate selected documents"}</button><button className="button-secondary" disabled={Object.keys(documents).length === 0} onClick={downloadWorkspace}>Download workspace ZIP</button></div></div>{Object.entries(documents).map(([filename, document]) => <article className="rounded-lg border border-slate-700 bg-slate-950/40 p-4" key={filename}><div className="flex items-center justify-between gap-3"><strong>{filename}</strong><span className="text-xs text-slate-400">{document.status}</span></div>{document.error && <p className="mt-2 text-sm text-amber-200">{document.error}</p>}{document.content && <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-300">{document.content}</pre>}</article>)}</div></section>}
  </main>;
}
