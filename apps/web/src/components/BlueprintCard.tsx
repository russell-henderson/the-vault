import { useRef } from "react";
import type { Blueprint } from "@the-vault/shared";

type BlueprintCardProps = {
  blueprint: Blueprint;
  isSelected: boolean;
  isManageMode: boolean;
  showMenu: boolean;
  isRenaming: boolean;
  renameValue: string;
  isTagEditorOpen: boolean;
  newTagValue: string;
  isDeleting: boolean;
  coverUrl?: string;
  onCardClick: () => void;
  onToggleMenu: () => void;
  onStartRename: () => void;
  onStartTagEdit: () => void;
  onConfirmDelete: () => void;
  onStartDelete: () => void;
  onRenameValueChange: (value: string) => void;
  onRenameSubmit: () => void;
  onCancelRename: () => void;
  onTagValueChange: (value: string) => void;
  onAddTag: () => void;
  onCancelTagEdit: () => void;
  onRemoveTag: (tag: string) => void;
  onChangeCover?: (file: File) => void;
  onRemoveCover?: () => void;
};

export function BlueprintCard({ blueprint, isSelected, isManageMode, showMenu, isRenaming, renameValue, isTagEditorOpen, newTagValue, isDeleting, coverUrl, onCardClick, onToggleMenu, onStartRename, onStartTagEdit, onConfirmDelete, onStartDelete, onRenameValueChange, onRenameSubmit, onCancelRename, onTagValueChange, onAddTag, onCancelTagEdit, onRemoveTag, onChangeCover, onRemoveCover }: BlueprintCardProps) {
  const coverInputRef = useRef<HTMLInputElement>(null);

  return <article
    className={`group relative panel card-hover blueprint-card ${coverUrl ? "blueprint-card-cover" : "blueprint-card-empty"} min-h-[20rem] cursor-pointer text-left transition-all duration-300 ${isSelected ? "ring-2 ring-blue-500 bg-blue-500/5 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]" : ""}`}
    style={coverUrl ? { backgroundImage: `url("${coverUrl}")`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
    onClick={onCardClick}
    onKeyDown={(event) => { if (event.target !== event.currentTarget) return; if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onCardClick(); } }}
    tabIndex={0}
    role="button"
    aria-label={`Open blueprint ${blueprint.name}`}
  >
    {coverUrl && <div className="pointer-events-none absolute inset-0 bg-slate-950/60 backdrop-blur-md" aria-hidden="true" />}
    {isManageMode && <div className="absolute left-3 top-3 z-10" aria-hidden="true"><div className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${isSelected ? "border-blue-500 bg-blue-600 text-white" : "border-white/20 bg-slate-950/40"}`}>{isSelected && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}</div></div>}

    {!isManageMode && <div className="absolute right-3 top-3 z-20 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
      <button type="button" onClick={(event) => { event.stopPropagation(); onToggleMenu(); }} className="rounded-md p-1 text-slate-400 transition-all hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-400/70" aria-label={`Actions for ${blueprint.name}`} aria-expanded={showMenu} aria-haspopup="menu">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
      </button>
    </div>}

    {showMenu && <div className="absolute right-3 top-10 z-30 w-48 animate-fade-in rounded-xl border border-white/10 bg-slate-950/95 py-2 shadow-2xl backdrop-blur-md" role="menu" onClick={(event) => event.stopPropagation()}>
      <button type="button" role="menuitem" onClick={onStartRename} className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-white">✏️ Rename</button>
      <button type="button" role="menuitem" onClick={onStartTagEdit} className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-white">🏷️ Edit Tags</button>
      <button type="button" role="menuitem" onClick={() => coverInputRef.current?.click()} className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-white">🖼️ Change cover</button>
      {coverUrl && <button type="button" role="menuitem" onClick={() => onRemoveCover?.()} className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-white">⌫ Remove cover</button>}
      <div className="my-1 border-t border-white/5" />
      {isDeleting ? <button type="button" role="menuitem" onClick={onConfirmDelete} className="flex w-full items-center gap-2 bg-rose-500/10 px-4 py-2 text-left text-xs font-semibold text-rose-400 hover:bg-rose-500/20">Confirm Delete?</button> : <button type="button" role="menuitem" onClick={onStartDelete} className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10">🗑️ Delete Blueprint</button>}
    </div>}

    <input ref={coverInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" aria-label={`Choose a cover image for ${blueprint.name}`} onClick={(event) => event.stopPropagation()} onChange={(event) => { const file = event.target.files?.[0]; if (file) onChangeCover?.(file); event.currentTarget.value = ""; }} />

    <div className="relative z-10 flex min-h-[20rem] flex-col p-5">
    <div className="flex items-start gap-3">
      <span className="tag">{blueprint.framework}</span>
    </div>

    {isRenaming ? <div className="mt-4 flex gap-2" onClick={(event) => event.stopPropagation()}>
      <input type="text" className="w-full rounded-md border border-white/10 bg-slate-950 p-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={renameValue} onChange={(event) => onRenameValueChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") onRenameSubmit(); }} aria-label={`Rename ${blueprint.name}`} autoFocus />
      <button type="button" onClick={onRenameSubmit} className="rounded-md bg-blue-600 px-2.5 text-xs text-white hover:bg-blue-500">Save</button>
      <button type="button" onClick={onCancelRename} className="rounded-md bg-white/5 px-2.5 text-xs hover:bg-white/10">Cancel</button>
    </div> : <h2 className="mt-5 text-lg font-semibold text-white">{blueprint.name}</h2>}

    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{blueprint.description}</p>

    <div className="mt-4 flex flex-wrap items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
      {(blueprint.tags || []).map((tag) => <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-teal-500/30 bg-teal-500/15 px-2 py-0.5 text-[10px] font-medium tracking-wide text-teal-300">
        #{tag}
        {!isManageMode && <button type="button" onClick={() => onRemoveTag(tag)} className="ml-0.5 font-bold text-teal-200/70 transition-opacity hover:text-rose-300" aria-label={`Remove tag ${tag}`}>×</button>}
      </span>)}
      {!isManageMode && !isTagEditorOpen && <button type="button" onClick={onStartTagEdit} className="px-2 py-0.5 text-[10px] text-blue-400 hover:underline">+ Tag</button>}
      {isTagEditorOpen && <div className="flex items-center gap-1">
        <input type="text" className="w-20 border-b border-blue-500 bg-transparent text-xs text-white outline-none" placeholder="new tag" value={newTagValue} onChange={(event) => onTagValueChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") onAddTag(); }} aria-label="New tag" autoFocus />
        <button type="button" onClick={onAddTag} className="ml-1 text-[10px] font-semibold text-emerald-400">Add</button>
        <button type="button" onClick={onCancelTagEdit} className="ml-1 text-[10px] text-slate-400">Cancel</button>
      </div>}
    </div>

    {blueprint.implementationPlan && <div className="mt-4 flex items-center gap-2 text-xs text-emerald-300"><span className="check-mark">✓</span> Architecture packet attached</div>}
    <div className="mt-auto flex w-full items-end justify-between gap-4 pt-6 text-xs text-slate-500">
      <span>{blueprint.language} · {blueprint.dependencies.length} dependencies</span>
      <span className="whitespace-nowrap">{new Date(blueprint.updatedAt).toLocaleDateString()}</span>
    </div>
    </div>
  </article>;
}
