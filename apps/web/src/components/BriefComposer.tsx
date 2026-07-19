import { useEffect, useState } from "react";
import type { BlueprintProposal, DiscoveryResult, ProviderCatalog, ProviderSelection, ProviderStatus as ProviderStatusData } from "@the-vault/shared";
import { api } from "../lib/api";
import { BlueprintProposal as BlueprintProposalCard } from "./BlueprintProposal";
import { ProviderStatus } from "./ProviderStatus";
import { ProviderRoleControl } from "./ProviderRoleControl";
import { EmbeddingModelProbe } from "./EmbeddingModelProbe";

export function BriefComposer({ providerStatus, catalog, catalogLoading, onRefreshCatalog, onApprove, onManual, onCancel }: { providerStatus?: ProviderStatusData; catalog?: ProviderCatalog; catalogLoading: boolean; onRefreshCatalog: () => Promise<boolean>; onApprove: (proposal: BlueprintProposal) => Promise<void>; onManual: (brief?: string, autoFill?: boolean) => void; onCancel: () => void }) {
  const [brief, setBrief] = useState("Build an app that helps people track and understand their daily habits.");
  const initialProvider = catalog?.configured.analysis.provider ?? (providerStatus?.configured.name === "ollama" ? "ollama" : "mock");
  const [analysisSelection, setAnalysisSelection] = useState<ProviderSelection>({ provider: initialProvider });
  const [discovery, setDiscovery] = useState<DiscoveryResult>();
  const [selectedStack, setSelectedStack] = useState<string>();
  const [proposal, setProposal] = useState<BlueprintProposal>();
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (catalog && !analysisSelection.model && analysisSelection.provider !== catalog.configured.analysis.provider) setAnalysisSelection({ provider: catalog.configured.analysis.provider }); }, [catalog, analysisSelection.model, analysisSelection.provider]);
  const selectedOption = catalog?.models.find((option) => option.provider === analysisSelection.provider && option.model === analysisSelection.model);
  const selectionUnavailable = !analysisSelection.model || (analysisSelection.provider !== "mock" && (!selectedOption || !selectedOption.available));

  function resetDiscovery() { setDiscovery(undefined); setSelectedStack(undefined); setError(""); }

  async function analyze(event: React.FormEvent) {
    event.preventDefault();
    if (!brief.trim()) return;
    onManual(brief);
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
    <div className="panel composer-hero relative overflow-hidden">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Local discovery</p>
            <h2 className="section-title text-2xl">Start with intent.</h2>
          </div>
          <ProviderStatus status={providerStatus} catalog={catalog} />
        </div>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
          Describe the outcome in your own language. The Analyzer will suggest only registered stack directions and ask what is still missing before any architecture is synthesized.
        </p>
        <form className="mt-6 animate-fade-in" onSubmit={analyze}>
          {/* Main Prompt Area with Auto-Fill */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">What are you building?</span>
            </div>
            <div className="relative rounded-xl overflow-hidden bg-slate-950/40 border border-white/10 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:shadow-[0_0_15px_rgba(59,130,246,0.2)] focus-within:border-blue-500/50 transition-all duration-300">
              <textarea
                className="w-full bg-transparent border-0 ring-0 focus:ring-0 focus:outline-none p-4 pb-14 text-slate-200 placeholder-slate-500 resize-y"
                rows={8}
                value={brief}
                onChange={(event) => { setBrief(event.target.value); resetDiscovery(); }}
                placeholder="Describe the outcome, users, and constraints…"
              />
              <div className="absolute bottom-3 right-3">
                <button
                  type="button"
                  onClick={() => onManual(brief, true)}
                  disabled={!brief.trim()}
                  className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs py-1.5 px-3 rounded-lg shadow-lg flex items-center gap-1.5 transition-all"
                >
                  <span>✦ Auto-Fill Fields</span>
                </button>
              </div>
            </div>
          </div>

          {discovery && (
            <div className={`mt-4 rounded-xl border p-4 text-sm ${review ? "border-amber-300/25 bg-amber-300/[.06] text-amber-100" : "border-cyan-300/20 bg-cyan-300/[.05] text-slate-200"}`} role={review ? "alert" : "status"}>
              <p className="font-semibold uppercase tracking-wider">{review ? "Review required" : `Discovery · ${discovery.domain ?? "domain still open"}`}</p>
              {discovery.reasons.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs leading-5">
                  {discovery.reasons.map((reason) => <li key={reason}>• {reason}</li>)}
                </ul>
              )}
              {!review && (
                <>
                  <p className="mt-2 text-xs leading-5 text-slate-400">Choose a registered direction, refine the brief if needed, then confirm it before synthesis.</p>
                  <div className="mt-3 grid gap-2">
                    {discovery.likelyStackOptions.map((option) => (
                      <button className={`stack-option ${selectedStack === option.stackId ? "stack-option-selected" : ""}`} key={option.stackId} type="button" onClick={() => setSelectedStack(option.stackId)}>
                        <span><strong>{option.stackId}</strong><span>{option.reason}</span></span>
                        <small>{Math.round(option.confidence * 100)}%</small>
                      </button>
                    ))}
                  </div>
                  {discovery.missingInfo.length > 0 && <p className="mt-3 text-xs text-amber-200">Missing: {discovery.missingInfo.join(" · ")}</p>}
                  {discovery.clarifyingQuestions.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-slate-400">
                      {discovery.clarifyingQuestions.map((question) => <li key={question}>? {question}</li>)}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}

          {error && <div className="alert-error mt-4">{error}</div>}

          {/* Unified Action Footer (Frosted Glass Control Bar) */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            {/* Left Side */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <ProviderRoleControl role="analysis" catalog={catalog} loading={catalogLoading} selection={analysisSelection} onChange={setAnalysisSelection} onRefresh={onRefreshCatalog} />
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">Choose a model before running</span>
            </div>

            {/* Right Side */}
            <div className="flex gap-2">
              <button
                className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all text-sm"
                disabled={analyzing || !brief.trim() || selectionUnavailable}
                type="submit"
              >
                {analyzing ? <><span className="inline-spinner" /> Analyzing…</> : "Analyze idea / Compile Prompt →"}
              </button>
              {discovery?.status === "discovery" && (
                <button
                  className="button-primary"
                  disabled={generating || analyzing || !selectedStack || selectionUnavailable || synthesisBlocked}
                  type="button"
                  onClick={() => void synthesize()}
                >
                  {generating ? <><span className="inline-spinner" /> Synthesizing…</> : "Confirm & synthesize →"}
                </button>
              )}
            </div>
          </div>
          <EmbeddingModelProbe options={catalog?.embeddingModels ?? []} loading={catalogLoading} />
        </form>

        {/* Tags horizontal flex row */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="bg-white/5 text-xs text-white/50 rounded-full px-3 py-1 font-medium select-none">Discovery first</span>
          <span className="bg-white/5 text-xs text-white/50 rounded-full px-3 py-1 font-medium select-none">Strict registry routing</span>
          <span className="bg-white/5 text-xs text-white/50 rounded-full px-3 py-1 font-medium select-none">Human confirmation required</span>
        </div>
      </div>
    </div>

    {/* Elevated Right Sidebar with Interactive Stepper & Connecting Line */}
    <div className="panel composer-side relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-white/10 rounded-xl p-6 shadow-2xl flex flex-col justify-between">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 pointer-events-none" />
      <div className="relative z-10">
        <p className="eyebrow mb-6">How the handoff works</p>
        <div className="relative flex flex-col gap-8">
          {/* Vertical connecting line */}
          <div className="absolute left-5 top-5 bottom-5 w-[1px] bg-gradient-to-b from-blue-500 via-purple-500 to-emerald-500 opacity-45" />

          {/* Step 1 */}
          <div className="flex items-start gap-4 relative">
            <span className="w-10 height-10 min-w-10 min-h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pen-tool"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m19 12-6.5-6.5a2 2 0 0 0-2.83 0L3.7 11.45a2 2 0 0 0 0 2.83L10 20.5"/><path d="m14 2-5 5"/><path d="m2 22 5-5"/></svg>
            </span>
            <div>
              <strong className="text-sm font-semibold text-white tracking-wide block mb-0.5">Describe</strong>
              <p className="text-xs text-slate-400 leading-relaxed">Your brief stays the source of intent.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4 relative">
            <span className="w-10 height-10 min-w-10 min-h-10 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-compass"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            </span>
            <div>
              <strong className="text-sm font-semibold text-white tracking-wide block mb-0.5">Discover</strong>
              <p className="text-xs text-slate-400 leading-relaxed">The Analyzer suggests registered directions and asks questions.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4 relative">
            <span className="w-10 height-10 min-w-10 min-h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </span>
            <div>
              <strong className="text-sm font-semibold text-white tracking-wide block mb-0.5">Confirm</strong>
              <p className="text-xs text-slate-400 leading-relaxed">You choose the stack before final synthesis begins.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="side-callout bg-slate-950/50 border border-white/5 rounded-lg p-3.5 mt-6 flex items-start gap-2 relative z-10">
        <span className="text-cyan-400 text-base leading-none select-none">✦</span>
        <p className="text-xs leading-relaxed text-slate-400">AI recommends. You confirm. The registry guards the handoff.</p>
      </div>
    </div>

    <div className="col-span-full flex flex-col-reverse justify-end gap-3 sm:flex-row mt-4">
      <button className="button-secondary" type="button" onClick={onCancel}>Cancel</button>
      <button className="button-secondary" type="button" onClick={() => onManual(brief)}>Use structured form instead</button>
    </div>
  </section>;
}
