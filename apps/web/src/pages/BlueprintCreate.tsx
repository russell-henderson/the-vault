import type { BlueprintInput } from "@the-vault/shared";
import { BlueprintForm } from "../components/BlueprintForm";

export function BlueprintCreate({ onSubmit, onCancel }: { onSubmit: (input: BlueprintInput) => Promise<void>; onCancel: () => void }) {
  return <><div className="mb-8"><button className="back-link" onClick={onCancel}>← Back to blueprints</button><p className="eyebrow mt-8">Step 1 · Human intent</p><h1 className="page-title">Create a component blueprint</h1><p className="page-subtitle">Give Codex the architectural context it needs before implementation begins. Required sections are validated before anything is stored.</p></div><BlueprintForm onSubmit={onSubmit} onCancel={onCancel} /></>;
}
