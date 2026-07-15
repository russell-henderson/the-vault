import { useState } from "react";
import { blueprintInputSchema, type BlueprintInput } from "@the-vault/shared";

type BlueprintFormProps = { onSubmit: (blueprint: BlueprintInput) => Promise<void>; onCancel: () => void };
type FormState = Omit<BlueprintInput, "dependencies" | "constraints"> & { dependencies: string; constraints: string };

const initialState: FormState = { name: "", description: "", targetPath: "", language: "TypeScript", framework: "React", dependencies: "", architectureOverview: "", coreLogic: "", layoutDesign: "", constraints: "" };
const fields: Array<{ key: keyof Omit<FormState, "dependencies" | "constraints">; label: string; placeholder: string; rows?: number }> = [
  { key: "description", label: "Description", placeholder: "What is this component responsible for?", rows: 3 },
  { key: "architectureOverview", label: "Architecture overview", placeholder: "Describe its boundary, collaborators, and role.", rows: 4 },
  { key: "coreLogic", label: "Core logic", placeholder: "Describe behavior, state transitions, and invariants.", rows: 4 },
  { key: "layoutDesign", label: "Layout and UI design", placeholder: "Describe layout, interaction, and accessibility requirements.", rows: 4 }
];

function splitLines(value: string) { return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean); }

export function BlueprintForm({ onSubmit, onCancel }: BlueprintFormProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = blueprintInputSchema.safeParse({ ...form, dependencies: splitLines(form.dependencies), constraints: splitLines(form.constraints) });
    if (!result.success) { setErrors(result.error.issues.map((issue) => `${String(issue.path[0] ?? "blueprint")}: ${issue.message}`)); return; }
    setErrors([]); setSaving(true);
    try { await onSubmit(result.data); } catch (error) { setErrors([error instanceof Error ? error.message : "Unable to save blueprint"]); } finally { setSaving(false); }
  }

  return <form className="space-y-8" onSubmit={submit}>
    {errors.length > 0 && <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200"><p className="font-semibold">Blueprint needs attention</p><ul className="mt-2 list-disc space-y-1 pl-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
    <section className="panel space-y-5"><div><p className="eyebrow">Identity</p><h2 className="section-title">Name the component</h2></div><div className="grid gap-5 md:grid-cols-3"><label className="field md:col-span-2"><span>Component name</span><input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="FeatureFlagPanel" /></label><label className="field"><span>Target path</span><input value={form.targetPath} onChange={(event) => update("targetPath", event.target.value)} placeholder="src/components/FeatureFlagPanel.tsx" /></label><label className="field"><span>Language</span><input value={form.language} onChange={(event) => update("language", event.target.value)} /></label><label className="field md:col-span-2"><span>Framework</span><input value={form.framework} onChange={(event) => update("framework", event.target.value)} /></label></div></section>
    <section className="panel space-y-5"><div><p className="eyebrow">Specification</p><h2 className="section-title">Make intent explicit</h2></div><label className="field"><span>Description</span><textarea rows={3} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="What is this component responsible for?" /></label>{fields.filter((field) => field.key !== "description").map((field) => <label className="field" key={field.key}><span>{field.label}</span><textarea rows={field.rows} value={form[field.key]} onChange={(event) => update(field.key, event.target.value)} placeholder={field.placeholder} /></label>)}</section>
    <section className="grid gap-6 md:grid-cols-2"><label className="panel field"><span>Dependencies <small>one per line</small></span><textarea rows={5} value={form.dependencies} onChange={(event) => update("dependencies", event.target.value)} placeholder="feature-flag-api\nshared-ui" /></label><label className="panel field"><span>Constraints <small>one per line</small></span><textarea rows={5} value={form.constraints} onChange={(event) => update("constraints", event.target.value)} placeholder="Do not own server persistence\nSupport keyboard navigation" /></label></section>
    <div className="flex justify-end gap-3"><button className="button-secondary" type="button" onClick={onCancel}>Cancel</button><button className="button-primary" disabled={saving} type="submit">{saving ? "Saving…" : "Save blueprint"}</button></div>
  </form>;
}
