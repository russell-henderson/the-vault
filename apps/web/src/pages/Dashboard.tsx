import { useState, useEffect, useRef } from "react";
import { normalizeTag, type Blueprint, type ProviderStatus as ProviderStatusData } from "@the-vault/shared";
import { ProviderStatus } from "../components/ProviderStatus";
import { BlueprintCard } from "../components/BlueprintCard";
import { api } from "../lib/api";
import { exportBulkBlueprintsAsZip } from "../lib/workspace-export";
import { loadBlueprintCoverUrl, removeBlueprintCover, saveBlueprintCover } from "../lib/blueprint-covers";

type DashboardProps = {
  blueprints: Blueprint[];
  providerStatus?: ProviderStatusData;
  loading: boolean;
  error?: string;
  onNavigate: (path: string) => void;
  onBlueprintUpdated?: (blueprint: Blueprint) => void;
  onBlueprintsDeleted?: (ids: string[]) => void;
};

export function Dashboard({ blueprints, providerStatus, loading, error, onNavigate, onBlueprintUpdated, onBlueprintsDeleted }: DashboardProps) {
  const [localBlueprints, setLocalBlueprints] = useState<Blueprint[]>(blueprints);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({});
  const coverUrlsRef = useRef<Record<string, string>>({});

  // Inline editing states
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [newTagBlueprintId, setNewTagBlueprintId] = useState<string | null>(null);
  const [newTagValue, setNewTagValue] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Bulk actions states
  const [isExporting, setIsExporting] = useState(false);
  const [isBulkLabeling, setIsBulkLabeling] = useState(false);
  const [bulkTagValue, setBulkTagValue] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState("");

  // Sync blueprints from props
  useEffect(() => {
    setLocalBlueprints(blueprints);
  }, [blueprints]);

  useEffect(() => {
    let cancelled = false;
    const ids = new Set(localBlueprints.map((blueprint) => blueprint.id));
    const existing = coverUrlsRef.current;
    const missingIds = localBlueprints.map((blueprint) => blueprint.id).filter((id) => !existing[id]);
    void Promise.all(missingIds.map(async (id) => [id, await loadBlueprintCoverUrl(id)] as const)).then((entries) => {
      if (cancelled) return;
      const next = Object.fromEntries(Object.entries(existing).filter(([id]) => ids.has(id)));
      for (const [id, url] of entries) if (url) next[id] = url;
      for (const [id, url] of Object.entries(existing)) if (!next[id] || next[id] !== url) URL.revokeObjectURL(url);
      coverUrlsRef.current = next;
      setCoverUrls(next);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [localBlueprints.map((blueprint) => blueprint.id).join("|")]);

  useEffect(() => () => {
    for (const url of Object.values(coverUrlsRef.current)) URL.revokeObjectURL(url);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Extraction of unique tags
  const allTags = Array.from(
    new Set(localBlueprints.flatMap((bp) => bp.tags || []))
  );

  const toggleTagFilter = (tag: string) => {
    setActiveTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    );
  };

  const filteredBlueprints = localBlueprints.filter((bp) => {
    if (activeTags.length === 0) return true;
    return activeTags.every((tag) => bp.tags?.includes(tag));
  });

  const toggleSelectCard = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  };

  const handleCardClick = (id: string) => {
    if (isManageMode) {
      toggleSelectCard(id);
    } else {
      onNavigate(`/blueprints/${id}`);
    }
  };

  const handleRenameSubmit = async (id: string) => {
    if (!renameValue.trim()) return;
    try {
      const updated = await api.patchBlueprint(id, { projectName: renameValue.trim() });
      setLocalBlueprints((current) =>
        current.map((bp) => (bp.id === id ? updated : bp))
      );
      onBlueprintUpdated?.(updated);
      setRenamingId(null);
      setRenameValue("");
      showToast("Blueprint renamed successfully");
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Rename failed");
    }
  };

  const handleAddTag = async (id: string) => {
    if (!newTagValue.trim()) return;
    const blueprint = localBlueprints.find((bp) => bp.id === id);
    if (!blueprint) return;
    const nextTag = normalizeTag(newTagValue);
    if (!nextTag) return;
    const updatedTags = Array.from(new Set([...(blueprint.tags || []), nextTag]));
    try {
      const updated = await api.patchBlueprint(id, { tags: updatedTags });
      setLocalBlueprints((current) =>
        current.map((bp) => (bp.id === id ? updated : bp))
      );
      onBlueprintUpdated?.(updated);
      setNewTagBlueprintId(null);
      setNewTagValue("");
      showToast("Tag added successfully");
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Add tag failed");
    }
  };

  const handleRemoveTag = async (id: string, tagToRemove: string) => {
    const blueprint = localBlueprints.find((bp) => bp.id === id);
    if (!blueprint) return;
    const updatedTags = (blueprint.tags || []).filter((tag) => tag !== tagToRemove && tag.toLowerCase() !== tagToRemove.toLowerCase());
    try {
      const updated = await api.patchBlueprint(id, { tags: updatedTags });
      setLocalBlueprints((current) =>
        current.map((bp) => (bp.id === id ? updated : bp))
      );
      onBlueprintUpdated?.(updated);
      showToast("Tag removed");
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Tag removal failed");
    }
  };

  const handleDeleteBlueprint = async (id: string) => {
    try {
      await api.deleteBlueprint(id);
      setLocalBlueprints((current) => current.filter((bp) => bp.id !== id));
      onBlueprintsDeleted?.([id]);
      setSelectedIds((current) => current.filter((x) => x !== id));
      await removeBlueprintCover(id).catch(() => undefined);
      const coverUrl = coverUrlsRef.current[id];
      if (coverUrl) URL.revokeObjectURL(coverUrl);
      const nextCoverUrls = { ...coverUrlsRef.current };
      delete nextCoverUrls[id];
      coverUrlsRef.current = nextCoverUrls;
      setCoverUrls(nextCoverUrls);
      setDeletingId(null);
      showToast("Blueprint deleted");
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const ids = [...selectedIds];
    const results = await Promise.allSettled(ids.map((id) => api.deleteBlueprint(id)));
    const deletedIds = ids.filter((id, index) => {
      const result = results[index];
      return result?.status === "fulfilled" && result.value.success;
    });
    if (deletedIds.length > 0) {
      setLocalBlueprints((current) => current.filter((bp) => !deletedIds.includes(bp.id)));
      onBlueprintsDeleted?.(deletedIds);
      await Promise.all(deletedIds.map((id) => removeBlueprintCover(id).catch(() => undefined)));
      const nextCoverUrls = { ...coverUrlsRef.current };
      for (const id of deletedIds) {
        if (nextCoverUrls[id]) URL.revokeObjectURL(nextCoverUrls[id]);
        delete nextCoverUrls[id];
      }
      coverUrlsRef.current = nextCoverUrls;
      setCoverUrls(nextCoverUrls);
    }
    setSelectedIds((current) => current.filter((id) => !deletedIds.includes(id)));
    if (deletedIds.length === ids.length) setIsManageMode(false);
    showToast(`Deleted ${deletedIds.length} of ${ids.length} blueprints`);
    if (deletedIds.length !== ids.length) setMutationError("Some blueprints could not be deleted. The remaining selections are still available for retry.");
  };

  const handleChangeCover = async (id: string, file: File) => {
    try {
      const nextUrl = await saveBlueprintCover(id, file);
      const previousUrl = coverUrlsRef.current[id];
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      const nextCoverUrls = { ...coverUrlsRef.current, [id]: nextUrl };
      coverUrlsRef.current = nextCoverUrls;
      setCoverUrls(nextCoverUrls);
      setActiveMenuId(null);
      showToast("Cover art saved to this browser");
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Cover upload failed");
    }
  };

  const handleRemoveCover = async (id: string) => {
    try {
      await removeBlueprintCover(id);
      const previousUrl = coverUrlsRef.current[id];
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      const nextCoverUrls = { ...coverUrlsRef.current };
      delete nextCoverUrls[id];
      coverUrlsRef.current = nextCoverUrls;
      setCoverUrls(nextCoverUrls);
      setActiveMenuId(null);
      showToast("Cover art removed");
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Cover removal failed");
    }
  };

  const handleBulkExport = async () => {
    if (selectedIds.length === 0) return;
    setIsExporting(true);
    try {
      await exportBulkBlueprintsAsZip(selectedIds);
      showToast(`Exported ${selectedIds.length} blueprints successfully`);
      setSelectedIds([]);
      setIsManageMode(false);
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Bulk export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleBulkLabelSubmit = async () => {
    if (!bulkTagValue.trim() || selectedIds.length === 0) return;
    const tag = normalizeTag(bulkTagValue);
    if (!tag) return;
    try {
      await Promise.all(
        selectedIds.map(async (id) => {
          const blueprint = localBlueprints.find(bp => bp.id === id);
          if (!blueprint) return;
          const updatedTags = Array.from(new Set([...(blueprint.tags || []), tag]));
          const updated = await api.patchBlueprint(id, { tags: updatedTags });
          setLocalBlueprints(current => current.map(bp => bp.id === id ? updated : bp));
          onBlueprintUpdated?.(updated);
        })
      );
      showToast(`Added tag #${tag} to ${selectedIds.length} blueprints`);
      setIsBulkLabeling(false);
      setBulkTagValue("");
      setSelectedIds([]);
      setIsManageMode(false);
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Bulk labeling failed");
    }
  };

  const packetCount = localBlueprints.filter((blueprint) => blueprint.implementationPlan).length;
  const activeProviderModel = providerStatus?.models?.creation ?? providerStatus?.configured?.model ?? "FALLBACK";
  const isProviderActive = providerStatus?.available === true;

  return (
    <>
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 border border-white/10 px-4 py-3 rounded-xl shadow-2xl text-xs font-medium text-white flex items-center gap-2 animate-fade-in">
          <span className="text-emerald-400">✓</span> {toastMessage}
        </div>
      )}
      {mutationError && <div className="mb-5 alert-error" role="alert"><div className="flex items-start justify-between gap-4"><span>{mutationError}</span><button type="button" onClick={() => setMutationError("")} aria-label="Dismiss error">×</button></div></div>}

      <section className="dashboard-hero relative mb-8 overflow-hidden">
        <div className="hero-grid" />
        <div className="pointer-events-none absolute left-0 top-0 -z-0 h-[300px] w-[600px] rounded-full bg-gradient-to-r from-teal-500/20 to-indigo-600/20 blur-[120px]" />
        <div className="relative z-10 flex flex-col items-start">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="live-mark">
                <span />
                LOCAL WORKSPACE
              </span>
              <ProviderStatus status={providerStatus} />
            </div>
            <h1 className="page-title max-w-3xl">THE VAULT ARCHITECT</h1>
            <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">
              <span>[ LOCAL WORKSPACE ]</span>
              <span>[ 🤖 MODEL: {activeProviderModel} ]</span>
            </div>
            <p className="page-subtitle max-w-2xl">
              Turn a human brief into a bounded blueprint, a reviewable AI handoff, and evidence you can trust.
            </p>
            <div className="mt-6 flex flex-row gap-4">
              <button
                className={`button-secondary ${isManageMode ? "bg-blue-600/20 text-blue-400 border-blue-500/50" : ""}`}
                onClick={() => {
                  setIsManageMode(!isManageMode);
                  setSelectedIds([]);
                  setIsBulkLabeling(false);
                }}
              >
                Manage Vault
              </button>
              <button className="button-primary hero-button" onClick={() => onNavigate("/blueprints/new")}>
                Start with a brief <span>↗</span>
              </button>
            </div>
          </div>
        </div>
        <div className="relative mt-8 flex flex-wrap gap-8 border-t border-b border-white/10 py-3 text-xs uppercase tracking-widest text-slate-400">
          <span>{localBlueprints.length} Blueprints</span>
          <span>{packetCount.toString().padStart(2, "0")} Architecture Packets</span>
          <span className="text-teal-400">{isProviderActive ? "Active" : "Offline"}</span>
        </div>
      </section>

      {error && <div className="mb-5 alert-error"><strong>Could not load the vault.</strong> {error}</div>}

      {loading ? (
        <div className="empty-panel">
          <div className="spinner" />
          <p>Loading your architecture vault…</p>
        </div>
      ) : localBlueprints.length === 0 ? (
        <div className="empty-panel min-h-[360px] flex-col justify-center text-center">
          <span className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-cyan-400/10 text-2xl text-cyan-300">✦</span>
          <h2 className="text-xl font-semibold text-white">Your architecture vault is empty</h2>
          <p className="mt-2 max-w-md text-sm text-slate-400">Start with a brief and let the local model shape the first reviewable blueprint.</p>
          <button className="button-primary mt-6" onClick={() => onNavigate("/blueprints/new")}>Create your first blueprint</button>
        </div>
      ) : (
        <section className="space-y-6">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="eyebrow">Your vault</p>
              <h2 className="section-title text-xl">Recent blueprints</h2>
            </div>
            <span className="text-xs uppercase tracking-wider text-slate-600">
              {isManageMode ? "Bulk selection active" : "Select a card to review"}
            </span>
          </div>

          {/* Horizontally scrolling tag filter bar */}
          {allTags.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none border-b border-white/5 select-none" aria-label="Filter blueprints by tag">
              {allTags.map((tag) => {
                const isActive = activeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTagFilter(tag)}
                    type="button"
                    aria-pressed={isActive}
                    className={`text-xs px-3 py-1 rounded-full transition-all flex-shrink-0 font-medium ${
                      isActive
                        ? "bg-teal-500/20 text-teal-300 border border-teal-500/50"
                        : "bg-teal-500/5 text-teal-300/80 border border-teal-500/20 hover:bg-teal-500/10"
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredBlueprints.map((blueprint) => <BlueprintCard
              key={blueprint.id}
              blueprint={blueprint}
              isSelected={selectedIds.includes(blueprint.id)}
              isManageMode={isManageMode}
              showMenu={activeMenuId === blueprint.id}
              isRenaming={renamingId === blueprint.id}
              renameValue={renameValue}
              isTagEditorOpen={newTagBlueprintId === blueprint.id}
              newTagValue={newTagValue}
              isDeleting={deletingId === blueprint.id}
              coverUrl={coverUrls[blueprint.id]}
              onCardClick={() => handleCardClick(blueprint.id)}
              onToggleMenu={() => setActiveMenuId(activeMenuId === blueprint.id ? null : blueprint.id)}
              onStartRename={() => { setRenamingId(blueprint.id); setRenameValue(blueprint.name); setActiveMenuId(null); }}
              onStartTagEdit={() => { setNewTagBlueprintId(blueprint.id); setActiveMenuId(null); }}
              onConfirmDelete={() => void handleDeleteBlueprint(blueprint.id)}
              onStartDelete={() => setDeletingId(blueprint.id)}
              onRenameValueChange={setRenameValue}
              onRenameSubmit={() => void handleRenameSubmit(blueprint.id)}
              onCancelRename={() => { setRenamingId(null); setRenameValue(""); }}
              onTagValueChange={setNewTagValue}
              onAddTag={() => void handleAddTag(blueprint.id)}
              onCancelTagEdit={() => { setNewTagBlueprintId(null); setNewTagValue(""); }}
              onRemoveTag={(tag) => void handleRemoveTag(blueprint.id, tag)}
              onChangeCover={(file) => void handleChangeCover(blueprint.id, file)}
              onRemoveCover={() => void handleRemoveCover(blueprint.id)}
            />)}
          </div>

          {/* Floating Action Bar for Bulk Management */}
          {isManageMode && selectedIds.length > 0 && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 backdrop-blur-md bg-slate-900/90 border border-white/10 rounded-xl p-4 flex items-center gap-6 shadow-2xl z-50 animate-slide-up">
              <span className="text-xs font-semibold text-white tracking-wide">{selectedIds.length} selected</span>
              <div className="flex gap-2">
                {isBulkLabeling ? (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      className="bg-slate-950 border border-white/10 rounded-md px-2 py-1 text-xs text-white outline-none w-28"
                      placeholder="tag name..."
                      value={bulkTagValue}
                      onChange={(e) => setBulkTagValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleBulkLabelSubmit()}
                      autoFocus
                    />
                    <button onClick={handleBulkLabelSubmit} className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3 py-1.5 rounded-lg">Apply</button>
                    <button onClick={() => { setIsBulkLabeling(false); setBulkTagValue(""); }} className="bg-white/5 hover:bg-white/10 text-white font-medium text-xs px-3 py-1.5 rounded-lg">Cancel</button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleBulkExport}
                      disabled={isExporting}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium text-xs px-4 py-2 rounded-lg transition-all"
                    >
                      {isExporting ? "Packaging..." : "Export ZIPs"}
                    </button>
                    <button
                      onClick={() => setIsBulkLabeling(true)}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs px-4 py-2 rounded-lg transition-all"
                    >
                      🏷️ Label Selected
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition-all"
                    >
                      Delete Selected
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}
