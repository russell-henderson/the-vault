import { useState, useEffect, useRef } from "react";
import { blueprintInputSchema, type BlueprintInput } from "@the-vault/shared";
import { api } from "../lib/api";
import { MarkdownPreview } from "./MarkdownPreview";

type BlueprintFormProps = { onSubmit: (blueprint: BlueprintInput) => Promise<void>; onCancel: () => void; initialBrief?: string; autoFillOnEntry?: boolean };
type FormState = Omit<BlueprintInput, "dependencies" | "constraints" | "technicalConstraints"> & { dependencies: string; constraints: string; technicalConstraints: string };

const initialState: FormState = {
  name: "",
  description: "",
  targetPath: "docs/PRD.md",
  language: "Markdown",
  framework: "PRD",
  dependencies: "",
  architectureOverview: "",
  coreLogic: "",
  layoutDesign: "PRD Document Layout",
  constraints: "",
  technicalConstraints: ""
};
const mockSeedEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK_SEED === "true";

function splitLines(value: string) { return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean); }

export function BlueprintForm({ onSubmit, onCancel, initialBrief = "", autoFillOnEntry = false }: BlueprintFormProps) {
  const [form, setForm] = useState<FormState>({
    ...initialState,
    description: initialBrief
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [extrapolating, setExtrapolating] = useState(false);
  const [highlighted, setHighlighted] = useState(false);
  const [preview, setPreview] = useState("");
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (initialBrief) {
      setForm((current) => ({ ...current, description: initialBrief }));
    }
  }, [initialBrief]);

  useEffect(() => {
    if (mockSeedEnabled && autoFillOnEntry && initialBrief) {
      void handleAutoFill(initialBrief);
    }
  }, [autoFillOnEntry, initialBrief]);

  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function handleAutoFill(desc?: string) {
    if (!mockSeedEnabled) return;
    const targetDesc = desc || form.description;
    if (!targetDesc.trim()) {
      setErrors(["Please enter a description before auto-filling."]);
      return;
    }
    setExtrapolating(true);
    setErrors([]);
    try {
      const data = await api.extrapolate(targetDesc);
      setForm((current) => ({
        ...current,
        name: data.projectName,
        architectureOverview: data.architectureOverview,
        coreLogic: data.coreLogic,
        dependencies: data.dependencies.join("\n"),
        technicalConstraints: data.technicalConstraints.join("\n"),
      }));

      const mdPreview = [
        `# ${data.projectName}`,
        "",
        `**Overview:** ${data.architectureOverview}`,
        "",
        `**Core Logic:** ${data.coreLogic}`,
        "",
        "**Dependencies:**",
        data.dependencies.map(d => `- ${d}`).join("\n"),
        "",
        "**Constraints:**",
        data.technicalConstraints.map(c => `- ${c}`).join("\n"),
        "",
        "**Comments:**",
        data.comments.map(c => `- ${c}`).join("\n")
      ].join("\n");
      setPreview(mdPreview);

      setHighlighted(true);
      setTimeout(() => setHighlighted(false), 2000);

      setTimeout(() => {
        submitButtonRef.current?.focus();
      }, 100);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Failed to auto-fill blueprint."]);
    } finally {
      setExtrapolating(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = blueprintInputSchema.safeParse({
      ...form,
      dependencies: splitLines(form.dependencies),
      constraints: splitLines(form.constraints),
      technicalConstraints: splitLines(form.technicalConstraints)
    });
    if (!result.success) {
      setErrors(result.error.issues.map((issue) => `${String(issue.path[0] ?? "blueprint")}: ${issue.message}`));
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      await onSubmit(result.data);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Unable to save blueprint"]);
    } finally {
      setSaving(false);
    }
  }

  const fieldClass = (isTextarea = false) => {
    let classes = "w-full bg-slate-950/40 border border-white/10 rounded-lg p-3 text-slate-200 placeholder-slate-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50";
    if (extrapolating) {
      classes += " animate-pulse bg-blue-500/5 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]";
    } else if (highlighted) {
      classes += " border-emerald-500/80 ring-2 ring-emerald-500/20 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.15)]";
    }
    return classes;
  };
  return <form className="space-y-8 animate-fade-in" onSubmit={submit}>
    {errors.length > 0 && <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200"><p className="font-semibold">Blueprint needs attention</p><ul className="mt-2 list-disc space-y-1 pl-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}

    <section className="panel space-y-5">
      <div>
        <p className="eyebrow">Identity</p>
        <h2 className="section-title">Name the Project</h2>
      </div>
      <div className="grid gap-5">
        <label className="field">
          <span className="block mb-2 text-sm font-medium text-slate-300">Project name</span>
          <input className={fieldClass()} value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="e.g. MySaaSApp" />
        </label>
      </div>
    </section>

    <section className="panel space-y-5">
      <div>
        <p className="eyebrow">Specification</p>
        <h2 className="section-title">Make intent explicit</h2>
      </div>
      {preview && (
        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-5 mt-4 animate-fade-in">
          <h4 className="meta-label mb-3">Executive Preview (README.md style)</h4>
          <div className="prose prose-invert max-h-[300px] overflow-auto text-sm leading-6">
            <MarkdownPreview markdown={preview} />
          </div>
        </div>
      )}
      <div className="field">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">Description</span>
          {mockSeedEnabled && <button
              type="button"
              className="button-secondary text-xs py-1 px-3"
              disabled={extrapolating}
              onClick={() => void handleAutoFill()}
            >
              {extrapolating ? "✦ Extrapolating…" : "✦ Auto-Fill Blueprint"}
            </button>}
        </div>
        <textarea className={fieldClass(true)} rows={3} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="What is this project responsible for?" />
      </div>
      <div className="field">
        <span className="block mb-2 text-sm font-medium text-slate-300">Project Scope & Goals</span>
        <textarea className={fieldClass(true)} rows={4} value={form.architectureOverview} onChange={(event) => update("architectureOverview", event.target.value)} placeholder="Describe the scope, goals, and key metrics." />
      </div>
      <div className="field">
        <span className="block mb-2 text-sm font-medium text-slate-300">Target Audience & Use Cases</span>
        <textarea className={fieldClass(true)} rows={4} value={form.coreLogic} onChange={(event) => update("coreLogic", event.target.value)} placeholder="Who is the audience and what are the main use cases?" />
      </div>
    </section>

    <section className="grid gap-6 md:grid-cols-3">
      <div className="panel field">
        <span className="block mb-2 text-sm font-medium text-slate-300">Dependencies <small className="text-slate-500 font-normal">one per line</small></span>
        <textarea className={fieldClass(true)} rows={5} value={form.dependencies} onChange={(event) => update("dependencies", event.target.value)} placeholder="e.g. fastify" />
      </div>
      <div className="panel field">
        <span className="block mb-2 text-sm font-medium text-slate-300">Technical Constraints <small className="text-slate-500 font-normal">one per line</small></span>
        <textarea className={fieldClass(true)} rows={5} value={form.technicalConstraints} onChange={(event) => update("technicalConstraints", event.target.value)} placeholder="e.g. Must be local-first" />
      </div>
      <div className="panel field">
        <span className="block mb-2 text-sm font-medium text-slate-300">Comments / Extra Context <small className="text-slate-500 font-normal">one per line</small></span>
        <textarea className={fieldClass(true)} rows={5} value={form.constraints} onChange={(event) => update("constraints", event.target.value)} placeholder="e.g. Support offline mode" />
      </div>
    </section>

    <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
      <button className="button-secondary" type="button" onClick={onCancel}>Cancel</button>
      <button ref={submitButtonRef} className="button-primary" disabled={saving || extrapolating} type="submit">{saving ? "Validating…" : "Validate & save blueprint"}</button>
    </div>
  </form>;
}
