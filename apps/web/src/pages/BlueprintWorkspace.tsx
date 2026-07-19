import { useEffect, useMemo, useState } from "react";
import type { BlueprintWorkspace as BlueprintWorkspaceData, CoreDocumentFilename, ProviderCatalog, ProviderSelection, WorkspaceDocument } from "@the-vault/shared";
import { api } from "../lib/api";
import { MarkdownPreview } from "../components/MarkdownPreview";
import { downloadMarkdown, downloadWorkspaceZip } from "../lib/workspace-export";

const coreDocumentFilenames: CoreDocumentFilename[] = ["README.md", "ARCHITECTURE.md", "API.md", "DEPLOYMENT.md", "TROUBLESHOOTING.md"];
const primaryThoughtMessages = [
  "Firing up the inference engines...",
  "Consulting the knowledge vault...",
  "Weaving context threads...",
  "Writing the logic... making the donuts!",
  "Refining the architecture...",
  "Man, this is some Good Code!",
  "Just a few more milliseconds..."
];
const secondaryThoughtMessages = ["Processing...", "This is going to be great!", "I'm making the donuts..."];

function requestedFilesFromHash(): string[] {
  if (typeof window === "undefined") return [];
  const query = window.location.hash.split("?")[1];
  if (!query) return [];
  const requested = new URLSearchParams(query).get("requestedFiles")?.split(",") ?? [];
  return requested.filter((filename) => filename === "README.md" || coreDocumentFilenames.includes(filename as CoreDocumentFilename));
}

function isTerminal(document: WorkspaceDocument): boolean {
  return document.status === "completed" || document.status === "failed";
}

function statusLabel(document: WorkspaceDocument, generating: boolean, queued = false): string {
  if (generating) return "Streaming live";
  if (queued) return "Queued";
  if (document.status === "completed" && document.content) return "Generated";
  if (document.status === "running") return "Syncing";
  if (document.status === "failed") return "Needs review";
  return "Pending";
}

function iconFor(filename: string, generating: boolean, failed: boolean): string {
  if (generating) return "◌";
  if (failed) return "⚠";
  return filename === "PRD.md" ? "✦" : filename === "README.md" ? "◈" : "▤";
}

export function BlueprintWorkspace({ id, catalog, onNavigate }: { id: string; catalog?: ProviderCatalog; catalogLoading: boolean; onRefreshCatalog: () => Promise<boolean>; onNavigate: (path: string) => void }) {
  const [workspace, setWorkspace] = useState<BlueprintWorkspaceData>();
  const [selectedFilename, setSelectedFilename] = useState<string>("PRD.md");
  const [selection, setSelection] = useState<ProviderSelection>();
  const [loading, setLoading] = useState(true);
  const [rerolling, setRerolling] = useState<CoreDocumentFilename>();
  const [requestedFiles, setRequestedFiles] = useState<string[]>([]);
  const [streamingFilename, setStreamingFilename] = useState<string>();
  const [liveStreamContent, setLiveStreamContent] = useState("");
  const [statusText, setStatusText] = useState(primaryThoughtMessages[0]);
  const [secondaryStatusText, setSecondaryStatusText] = useState(secondaryThoughtMessages[0]);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState("");

  // Sync to local disk states
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncPath, setSyncPath] = useState("");
  const [rememberPath, setRememberPath] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const generationActive = streamingFilename !== undefined || rerolling !== undefined;

  useEffect(() => {
    if (!generationActive) {
      setStatusText(primaryThoughtMessages[0]);
      setSecondaryStatusText(secondaryThoughtMessages[0]);
      return;
    }
    let primaryIndex = Math.floor(Math.random() * primaryThoughtMessages.length);
    let secondaryIndex = Math.floor(Math.random() * secondaryThoughtMessages.length);
    setStatusText(primaryThoughtMessages[primaryIndex]);
    setSecondaryStatusText(secondaryThoughtMessages[secondaryIndex]);
    const interval = window.setInterval(() => {
      primaryIndex = (primaryIndex + 1) % primaryThoughtMessages.length;
      secondaryIndex = (secondaryIndex + 1) % secondaryThoughtMessages.length;
      setStatusText(primaryThoughtMessages[primaryIndex]);
      setSecondaryStatusText(secondaryThoughtMessages[secondaryIndex]);
    }, 1500);
    return () => window.clearInterval(interval);
  }, [generationActive]);

  useEffect(() => {
    let cancelled = false;
    const requested = requestedFilesFromHash();
    setLoading(true);
    setRequestedFiles(requested);
    setEditedContent({});
    setEditMode(false);
    setStreamingFilename(undefined);
    setLiveStreamContent("");
    const query = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.hash.split("?")[1] ?? "");
    const queryProvider = query.get("provider");
    const queryModel = query.get("model");
    if ((queryProvider === "mock" || queryProvider === "ollama") && queryModel) {
      setSelection(queryProvider === "ollama" && queryModel.toLowerCase().startsWith("phi4-mini")
        ? { provider: "ollama" }
        : { provider: queryProvider, model: queryModel });
    } else setSelection(undefined);
    void api.getWorkspace(id).then((result) => {
      if (cancelled) return;
      setWorkspace(result);
      setSelectedFilename((current) => requested.includes(current) ? current : requested[0] ?? (result.documents.some((document) => document.filename === current) ? current : result.documents[0]?.filename ?? "PRD.md"));
      
      // Load saved sync path
      const saved = localStorage.getItem(`vault:sync-path:${id}`);
      if (saved) {
        setSyncPath(saved);
      }
    }).catch((loadError) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load workspace"); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!workspace || requestedFiles.length === 0 || !selection?.model) return;
    let cancelled = false;
    const filename = requestedFiles[0] as CoreDocumentFilename;
    let buffer = "";
    setStreamingFilename(filename);
    setLiveStreamContent("");
    setError("");
    setWorkspace((current) => current ? { ...current, documents: current.documents.map((document) => document.filename === filename ? { ...document, status: "running", error: undefined } : document) } : current);
    const source = api.streamCoreDocument(id, filename, selection, {
      onChunk: (chunk) => {
        if (cancelled) return;
        buffer += chunk;
        setLiveStreamContent(buffer);
      },
      onDone: () => {
        if (cancelled) return;
        const completedAt = new Date().toISOString();
        setWorkspace((current) => current ? { ...current, documents: current.documents.map((document) => document.filename === filename ? { ...document, status: "completed", content: buffer, error: undefined, updatedAt: completedAt } : document) } : current);
        setRequestedFiles((current) => current.filter((candidate) => candidate !== filename));
        setStreamingFilename(undefined);
        setLiveStreamContent("");
        setRerolling((current) => current === filename ? undefined : current);
      },
      onError: (message) => {
        if (cancelled) return;
        setWorkspace((current) => current ? { ...current, documents: current.documents.map((document) => document.filename === filename ? { ...document, status: "failed", content: buffer, error: message, updatedAt: new Date().toISOString() } : document) } : current);
        setRequestedFiles((current) => current.filter((candidate) => candidate !== filename));
        setStreamingFilename(undefined);
        setLiveStreamContent("");
        setRerolling((current) => current === filename ? undefined : current);
        setError(`${filename}: ${message}`);
      }
    });
    return () => { cancelled = true; source.close(); };
  }, [id, Boolean(workspace), requestedFiles, selection]);

  const activeDocument = useMemo(() => workspace?.documents.find((document) => document.filename === selectedFilename) ?? workspace?.documents[0], [selectedFilename, workspace]);
  const activeContent = activeDocument ? editedContent[activeDocument.filename] ?? (streamingFilename === activeDocument.filename ? liveStreamContent : activeDocument.content) : "";
  const exportableDocuments = workspace?.documents.filter((document) => document.status === "completed" && (editedContent[document.filename] ?? document.content).trim()).map((document) => ({ ...document, content: editedContent[document.filename] ?? document.content })) ?? [];
  const isGenerating = (document: WorkspaceDocument) => streamingFilename === document.filename || rerolling === document.filename;
  const isQueued = (document: WorkspaceDocument) => requestedFiles.includes(document.filename) && streamingFilename !== document.filename && !isTerminal(document);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isDirty = (filename: string) => {
    const originalDoc = workspace?.documents.find((d) => d.filename === filename);
    if (!originalDoc) return false;
    return editedContent[filename] !== undefined && editedContent[filename] !== originalDoc.content;
  };

  const handleFileClick = (filename: string) => {
    if (activeDocument && isDirty(activeDocument.filename)) {
      const confirmDiscard = window.confirm("You have unsaved changes. Discard them?");
      if (!confirmDiscard) return;
      
      // Discard changes
      setEditedContent((current) => {
        const next = { ...current };
        delete next[activeDocument.filename];
        return next;
      });
    }
    setSelectedFilename(filename);
    setEditMode(false);
  };

  const handleSaveChanges = () => {
    if (!activeDocument) return;
    setWorkspace((current) => {
      if (!current) return current;
      return {
        ...current,
        documents: current.documents.map((d) =>
          d.filename === activeDocument.filename ? { ...d, content: activeContent } : d
        )
      };
    });
    setEditedContent((current) => {
      const next = { ...current };
      delete next[activeDocument.filename];
      return next;
    });
    showToast("Changes saved locally");
  };

  const handleDiscardChanges = () => {
    if (!activeDocument) return;
    setEditedContent((current) => {
      const next = { ...current };
      delete next[activeDocument.filename];
      return next;
    });
    showToast("Changes discarded");
  };

  async function handleSyncToDisk() {
    if (!syncPath.trim()) return;
    setIsSyncing(true);
    try {
      const files = exportableDocuments.map((doc) => ({
        filename: doc.filename,
        content: doc.content
      }));
      await api.syncToDisk(id, syncPath.trim(), files);
      if (rememberPath) {
        localStorage.setItem(`vault:sync-path:${id}`, syncPath.trim());
      } else {
        localStorage.removeItem(`vault:sync-path:${id}`);
      }
      setShowSyncModal(false);
      showToast(`Successfully synced ${files.length} files to disk!`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  }

  async function reroll() {
    if (!activeDocument || activeDocument.filename === "PRD.md") return;
    const filename = activeDocument.filename as CoreDocumentFilename;
    setRerolling(filename); setError(""); setEditMode(false);
    setWorkspace((current) => current ? { ...current, documents: current.documents.map((document) => document.filename === filename ? { ...document, status: "running", error: undefined } : document) } : current);
    setRequestedFiles((current) => current.includes(filename) ? current : [filename, ...current]);
  }

  if (loading) return <div className="empty-panel"><div className="spinner" /><p>Loading document workspace…</p></div>;
  if (!workspace) return <div className="alert-error">{error || "Workspace not found"}</div>;

  return <div className="workspace-shell">
    {toastMessage && (
      <div className="fixed top-6 right-6 z-50 bg-slate-900 border border-white/10 px-4 py-3 rounded-xl shadow-2xl text-xs font-medium text-white flex items-center gap-2 animate-fade-in">
        <span className="text-emerald-400">✓</span> {toastMessage}
      </div>
    )}

    <div className="workspace-header">
      <div>
        <nav className="workspace-breadcrumbs" aria-label="Breadcrumb"><button type="button" onClick={() => onNavigate("/dashboard")}>Vault</button><span>/</span><button type="button" onClick={() => onNavigate(`/blueprints/${id}`)}>{workspace.blueprint.name}</button><span>/</span><strong>Workspace</strong></nav>
        <p className="eyebrow mt-5">Document workspace</p><h1 className="page-title">{workspace.blueprint.name}</h1><p className="page-subtitle">Review, edit, export, and selectively reroll the approved engineering context.</p>
      </div>
      <div className="workspace-header-actions flex gap-2">
        <button
          className="button-secondary"
          disabled={exportableDocuments.length === 0}
          onClick={() => setShowSyncModal(true)}
        >
          Sync to Local Folder ↘
        </button>
        <button className="button-secondary" disabled={exportableDocuments.length === 0} onClick={() => downloadWorkspaceZip(workspace.blueprint.name, exportableDocuments)}>Batch Export ZIP</button>
      </div>
    </div>
    {error && <div className="alert-error" role="alert">{error}</div>}

    {/* Read-Only Status Bar (Replaces model selector controls) */}
    <div className="flex items-center gap-2 mb-6">
      <span className="text-xs text-white/60 bg-white/5 border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5 select-none">
        <span>⚡ Model:</span> <span className="font-semibold text-white">{selection?.model || "Choose a model"}</span>
      </span>
      <span className="text-xs text-white/60 bg-white/5 border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5 select-none">
        <span>🔒 PRD Source:</span> <span className="font-semibold text-emerald-400">{workspace.prdExecutionId ? "Linked" : "Missing"}</span>
      </span>
    </div>

    <div className="workspace-layout">
      <aside className="workspace-sidebar" aria-label="Workspace documents">
        <div className="workspace-sidebar-label">Files</div>
        {workspace.documents.map((document) => {
          const generating = isGenerating(document);
          const queued = isQueued(document);
          const active = activeDocument?.filename === document.filename;
          const dirty = isDirty(document.filename);
          return <button
            className={`workspace-file-button transition-all duration-200 ${active ? "border-l-2 border-blue-500 bg-blue-500/10 text-white font-medium" : "border-l-2 border-transparent"}`}
            key={document.filename}
            onClick={() => handleFileClick(document.filename)}
          >
            <span className={`workspace-file-icon ${generating ? "workspace-file-icon-generating" : ""} ${document.status === "failed" ? "workspace-file-icon-failed" : ""}`} aria-label={generating ? "Generating" : document.status === "failed" ? "Generation failed" : undefined}>
              {generating ? <span className="animate-pulse text-teal-300" aria-hidden="true">◌</span> : iconFor(document.filename, generating, document.status === "failed")}
            </span>
            <span className="workspace-file-name">{document.filename}</span>
            <span className={`workspace-status workspace-status-${document.status} ${generating ? "workspace-status-generating" : ""}`}>
              {statusLabel(document, generating, queued)}
            </span>
            {dirty && (
              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block ml-auto flex-shrink-0 animate-pulse" title="Unsaved changes" />
            )}
          </button>;
        })}
      </aside>
      <main className="workspace-main">
        {activeDocument && <>
          <div className="workspace-document-header">
            <div>
              <p className="eyebrow">Active document</p>
              <h2>{activeDocument.filename}</h2>
              <span className={`workspace-status workspace-status-${activeDocument.status} ${isGenerating(activeDocument) ? "workspace-status-generating" : ""}`}>{statusLabel(activeDocument, isGenerating(activeDocument), isQueued(activeDocument))}</span>
            </div>
            <div className="workspace-document-controls flex items-center gap-2">
              <button className={`button-secondary ${editMode ? "workspace-control-active" : ""}`} type="button" aria-pressed={editMode} disabled={isGenerating(activeDocument) || activeDocument.status === "failed"} onClick={() => setEditMode((current) => !current)}>{editMode ? "Preview" : "Edit"}</button>
              <button className="button-secondary" disabled={activeDocument.filename === "PRD.md" || rerolling !== undefined || streamingFilename !== undefined || requestedFiles.length > 0 || !workspace.prdExecutionId} onClick={() => void reroll()}>{rerolling ? <><span className="inline-spinner" /> Rerolling…</> : activeDocument.status === "failed" ? "Retry Document" : "↻ Reroll This Document"}</button>
              {activeContent && (
                editMode && isDirty(activeDocument.filename) ? (
                  <>
                    <button
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs py-1.5 px-3 rounded-lg"
                      onClick={handleSaveChanges}
                    >
                      Save Changes
                    </button>
                    <button
                      className="bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs py-1.5 px-3 rounded-lg"
                      onClick={handleDiscardChanges}
                    >
                      Discard
                    </button>
                  </>
                ) : (
                  <button
                    className="button-primary text-xs py-1.5 px-3"
                    onClick={() => downloadMarkdown(activeDocument?.filename ?? "document.md", activeContent)}
                  >
                    Export {activeDocument?.filename}
                  </button>
                )
              )}
            </div>
          </div>
          {activeDocument.status === "failed" ? (
            <section className="generation-failed" role="alert">
              <span className="generation-failed-icon">⚠</span>
              <div>
                <p className="eyebrow">Generation failed</p>
                <h3>We couldn’t generate {activeDocument.filename}.</h3>
                <p>{activeDocument.error || "The provider did not return a usable document."}</p>
                <button className="button-primary" type="button" disabled={rerolling !== undefined || streamingFilename !== undefined || requestedFiles.length > 0 || !workspace.prdExecutionId} onClick={() => void reroll()}>{rerolling ? <><span className="inline-spinner" /> Retrying…</> : "Retry Document"}</button>
              </div>
            </section>
          ) : isGenerating(activeDocument) ? (
            <section className="generating-stream" role="status" aria-live="polite">
              <div className="mb-4 flex items-center justify-between gap-3"><div><p className="eyebrow">Thought cycle</p><h3>Building {activeDocument.filename}</h3><div className="mt-3 space-y-1" aria-label="Generation status"><p key={statusText} className="thought-cycle-line text-sm font-mono uppercase tracking-widest text-teal-500/70">{statusText}</p><p key={secondaryStatusText} className="thought-cycle-line text-xs font-mono uppercase tracking-widest text-teal-500/50">{secondaryStatusText}</p></div></div><span className="stream-live-indicator"><span /> LIVE</span></div>
              <div className="workspace-markdown-card"><MarkdownPreview markdown={liveStreamContent} emptyMessage="Waiting for the first token…" showCursor /></div>
            </section>
          ) : editMode ? (
            <textarea className="workspace-editor" aria-label={`Edit ${activeDocument.filename}`} value={activeContent} onChange={(event) => setEditedContent((current) => ({ ...current, [activeDocument.filename]: event.target.value }))} />
          ) : (
            <div className="bg-slate-900/40 border border-white/10 rounded-xl p-8 shadow-inner overflow-y-auto max-h-[70vh] prose prose-invert max-w-none">
              <MarkdownPreview markdown={activeContent} emptyMessage="This document is pending generation." />
            </div>
          )}
          {activeDocument.status === "failed" && activeDocument.content && <div className="workspace-markdown-card mt-4"><p className="eyebrow mb-3">Partial stream</p><MarkdownPreview markdown={activeDocument.content} /></div>}
          {activeDocument.status !== "failed" && activeDocument.error && <div className="workspace-warning">{activeDocument.error}</div>}
        </>}
      </main>
    </div>

    {/* Sync Local Modal */}
    {showSyncModal && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowSyncModal(false)}>
        <div className="bg-slate-950 border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-semibold text-white">Sync Workspace to Folder</h3>
          <p className="text-xs text-slate-400">Write all generated files directly to your local workspace disk folder.</p>
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Absolute Folder Path</label>
            <input
              type="text"
              className="bg-slate-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
              placeholder="C:\Users\username\project"
              value={syncPath}
              onChange={(e) => setSyncPath(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember-path"
              className="rounded border-white/10 bg-slate-900 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
              checked={rememberPath}
              onChange={(e) => setRememberPath(e.target.checked)}
            />
            <label htmlFor="remember-path" className="text-xs text-slate-300 cursor-pointer select-none">Remember this path for next sync</label>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowSyncModal(false)}
              className="bg-white/5 hover:bg-white/10 text-white font-medium text-xs px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSyncing || !syncPath.trim()}
              onClick={handleSyncToDisk}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium text-xs px-4 py-2 rounded-lg"
            >
              {isSyncing ? "Syncing..." : "Sync Folder"}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>;
}
