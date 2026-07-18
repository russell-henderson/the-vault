import type { CoreDocumentFilename } from "@the-vault/shared";

export const CORE_DOCUMENTS: Array<{ filename: CoreDocumentFilename; title: string; detail: string }> = [
  { filename: "ARCHITECTURE.md", title: "System topology", detail: "Boundaries, components, and data flow." },
  { filename: "API.md", title: "API contracts", detail: "Endpoints, payloads, and synchronization rules." },
  { filename: "DEPLOYMENT.md", title: "Deployment", detail: "CI/CD pipelines and hosting targets." },
  { filename: "TROUBLESHOOTING.md", title: "Failure modes", detail: "Edge cases, recovery, and operational guidance." }
];

export function DocumentSelectGrid({ selected, onChange }: { selected: CoreDocumentFilename[]; onChange: (files: CoreDocumentFilename[]) => void }) {
  function toggle(filename: CoreDocumentFilename) {
    onChange(selected.includes(filename) ? selected.filter((item) => item !== filename) : [...selected, filename]);
  }

  return <section className="document-select-panel">
    <div className="flex items-end justify-between gap-4">
      <div><p className="eyebrow">Document set</p><h3 className="section-title">Choose the next handoff</h3><p className="mt-1 text-xs text-slate-400">README.md is included as the workspace index. Select the supporting documents to generate.</p></div>
      <span className="tag">{selected.length}/4 selected</span>
    </div>
    <div className="document-select-grid">
      {CORE_DOCUMENTS.map((document) => {
        const active = selected.includes(document.filename);
        return <button className={`document-select-card ${active ? "document-select-card-active" : ""}`} key={document.filename} type="button" aria-pressed={active} onClick={() => toggle(document.filename)}>
          <span className={`document-checkbox ${active ? "document-checkbox-active" : ""}`}>{active ? "✓" : ""}</span>
          <span className="min-w-0 text-left"><strong>{document.filename}</strong><span>{document.title}</span><small>{document.detail}</small></span>
        </button>;
      })}
    </div>
  </section>;
}
