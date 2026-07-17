import { useEffect, useState } from "react";
import type { BlueprintProposal, DiscoveryResult, ProviderCatalog, ProviderSelection, ProviderStatus as ProviderStatusData } from "@the-vault/shared";
import { api, ApiRequestError } from "../lib/api";
import { BlueprintProposal as BlueprintProposalCard } from "./BlueprintProposal";
import { ProviderStatus } from "./ProviderStatus";
import { ProviderRoleControl } from "./ProviderRoleControl";

export function BriefComposer({ providerStatus, catalog, catalogLoading, onRefreshCatalog, onApprove, onManual, onCancel }: { providerStatus?: ProviderStatusData; catalog?: ProviderCatalog; catalogLoading: boolean; onRefreshCatalog: () => Promise<boolean>; onApprove: (proposal: BlueprintProposal) => Promise<void>; onManual: () => void; onCancel: () => void }) {
  const [brief, setBrief] = useState("Build an app that helps people track and understand their daily habits.");
  const defaultSelection: ProviderSelection = catalog?.configured.analysis ?? (providerStatus?.configured.name === "ollama" ? { provider: "ollama", model: providerStatus.models?.analysis ?? providerStatus.configured.model } : { provider: "mock", model: "deterministic-local" });
  const [analysisSelection, setAnalysisSelection] = useState<ProviderSelection>(defaultSelection);
  const [discovery, setDiscovery] = useState<DiscoveryResult>();
  const [selectedStack, setSelectedStack] = useState<string>();
  const [proposal, setProposal] = useState<BlueprintProposal>();
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (catalog && analysisSelection.provider === "ollama" && !analysisSelection.model) setAnalysisSelection(catalog.configured.analysis); }, [catalog, analysisSelection.model, analysisSelection.provider]);
  const selectedOption = catalog?.models.find((option) => option.provider === analysisSelection.provider && option.model === analysisSelection.model);
  const selectionUnavailable = analysisSelection.provider === "ollama" && (!selectedOption || !selectedOption.available);

  function resetDiscovery() { setDiscovery(undefined); setSelectedStack(undefined); setError(""); }

  async function analyze(event: React.FormEvent) {
    event.preventDefault();
    if (selectionUnavailable || !brief.trim()) return;
    setAnalyzing(true); setError(""); setDiscovery(undefined); setSelectedStack(undefined);
    try {
      const result = await api.analyzeArchitecture(brief, analysisSelection.provider === "mock" ? "mock" : "configured", analysisSelection);
      setDiscovery(result);
      if (result.status === "discovery" && result.likelyStackOptions.length === 1) setSelectedStack(result.likelyStackOptions[0].stackId);
    } catch (analysisError) {
      if (analysisError instanceof ApiRequestError && analysisError.status === 422 && analysisError.details?.status === "review-required") {
        setDiscovery(analysisError.details as unknown as DiscoveryResult);
      } else setError(analysisError instanceof Error ? analysisError.message : "Unable to analyze the app idea");
    } finally { setAnalyzing(false); }
  }

  async function synthesize() {
    if (!selectedStack || !discovery || discovery.status !== "discovery" || selectionUnavailable) return;
    setGenerating(true); setError("");
    try { setProposal(await api.generateBlueprintProposal(brief, selectedStack, discovery, analysisSelection.provider === "mock" ? "mock" : "configured", analysisSelection)); }
    catch (generationError) { setError(generationError instanceof Error ? generationError.message : "Unable to generate the validated architecture packet"); }
    finally { setGenerating(false); }
  }

  async function approve() { if (!proposal) return; setSaving(true); try { await onApprove(proposal); } finally { setSaving(false); } }
  if (proposal) return <BlueprintProposalCard proposal={proposal} saving={saving} onApprove={approve} onEdit={() => setProposal(undefined)} />;

  const review = discovery?.status === "review-required";
  const synthesisBlocked = Boolean(discovery?.missingInfo.length || discovery?.clarifyingQuestions.length || discovery?.unsupportedDiscoveries.length);
  return <section className="composer-grid">
    <div className="panel composer-hero"><div className="orb orb-one" /><div className="orb orb-two" /><div className="relative"><div className="flex items-center justify-between gap-4"><div><p className="eyebrow">Local discovery</p><h2 className="section-title text-2xl">Start with intent.</h2></div><ProviderStatus status={providerStatus} catalog={catalog} /></div><p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">Describe the outcome in your own language. The Analyzer will suggest only registered stack directions and ask what is still missing before any architecture is synthesized.</p><form className="mt-6" onSubmit={analyze}><label className="field"><span>What are you building?</span><textarea className="brief-input" rows={8} value={brief} onChange={(event) => { setBrief(event.target.value); resetDiscovery(); }} placeholder="Describe the outcome, users, and constraints…" /></label>{discovery && <div className={`mt-4 rounded-xl border p-4 text-sm ${review ? "border-amber-300/25 bg-amber-300/[.06] text-amber-100" : "border-cyan-300/20 bg-cyan-300/[.05] text-slate-200"}`} role={review ? "alert" : "status"}><p className="font-semibold uppercase tracking-wider">{review ? "Review required" : `Discovery · ${discovery.domain ?? "domain still open"}`}</p>{discovery.reasons.length > 0 && <ul className="mt-2 space-y-1 text-xs leading-5">{discovery.reasons.map((reason) => <li key={reason}>• {reason}</li>)}</ul>}{!review && <><p className="mt-2 text-xs leading-5 text-slate-400">Choose a registered direction, refine the brief if needed, then confirm it before synthesis.</p><div className="mt-3 grid gap-2">{discovery.likelyStackOptions.map((option) => <button className={`stack-option ${selectedStack === option.stackId ? "stack-option-selected" : ""}`} key={option.stackId} type="button" onClick={() => setSelectedStack(option.stackId)}><span><strong>{option.stackId}</strong><span>{option.reason}</span></span><small>{Math.round(option.confidence * 100)}%</small></button>)}</div>{discovery.missingInfo.length > 0 && <p className="mt-3 text-xs text-amber-200">Missing: {discovery.missingInfo.join(" · ")}</p>}{discovery.clarifyingQuestions.length > 0 && <ul className="mt-2 space-y-1 text-xs text-slate-400">{discovery.clarifyingQuestions.map((question) => <li key={question}>? {question}</li>)}</ul>}</>}</div>}{error && <div className="alert-error mt-4">{error}</div>}<div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><ProviderRoleControl role="analysis" catalog={catalog} loading={catalogLoading} selection={analysisSelection} onChange={setAnalysisSelection} onRefresh={onRefreshCatalog} /><div className="flex gap-2"><button className="button-secondary" disabled={analyzing || !brief.trim() || selectionUnavailable} type="submit">{analyzing ? <><span className="inline-spinner" /> Analyzing…</> : "Analyze idea"}</button>{discovery?.status === "discovery" && <button className="button-primary" disabled={generating || analyzing || !selectedStack || selectionUnavailable || synthesisBlocked} type="button" onClick={() => void synthesize()}>{generating ? <><span className="inline-spinner" /> Synthesizing…</> : "Confirm & synthesize →"}</button>}</div></div></form><div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-500"><span className="signal-pill">Discovery first</span><span className="signal-pill">Strict registry routing</span><span className="signal-pill">Human confirmation required</span></div></div></div>
    <div className="panel composer-side"><p className="eyebrow">How the handoff works</p><div className="flow-list"><div className="flow-item"><span className="flow-number">01</span><div><strong>Describe</strong><p>Your brief stays the source of intent.</p></div></div><div className="flow-item"><span className="flow-number">02</span><div><strong>Discover</strong><p>The Analyzer suggests registered directions and asks questions.</p></div></div><div className="flow-item"><span className="flow-number">03</span><div><strong>Confirm</strong><p>You choose the stack before final synthesis begins.</p></div></div></div><div className="side-callout"><span className="text-xl text-cyan-200">✦</span><p>AI recommends. You confirm. The registry guards the handoff.</p></div></div>
    <div className="col-span-full flex flex-col-reverse justify-end gap-3 sm:flex-row"><button className="button-secondary" type="button" onClick={onCancel}>Cancel</button><button className="button-secondary" type="button" onClick={onManual}>Use structured form instead</button></div>
  </section>;
}
