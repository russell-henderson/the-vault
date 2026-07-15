import { useState } from "react";
import type { ExecutionDetails } from "../lib/api";

export function VerificationPanel({ execution, saving, onVerify }: { execution?: ExecutionDetails; saving: boolean; onVerify: (notes: string) => Promise<void> }) {
  const [notes, setNotes] = useState("");
  if (!execution) return null;
  async function submit(event: React.FormEvent) { event.preventDefault(); if (!notes.trim()) return; await onVerify(notes.trim()); setNotes(""); }
  return <section className="panel"><div className="border-b border-white/10 px-5 py-4"><p className="eyebrow">Evidence layer</p><h2 className="section-title">Verification notes</h2></div><div className="p-5">{execution.verificationNotes && <div className="mb-4 rounded-lg border border-emerald-400/20 bg-emerald-400/[.06] p-3 text-sm leading-6 text-emerald-100">{execution.verificationNotes}</div>}<form className="space-y-3" onSubmit={submit}><textarea className="field-input" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Record what was checked, accepted, or still needs review…" /><div className="flex justify-end"><button className="button-secondary" disabled={saving || !notes.trim()} type="submit">{saving ? "Saving…" : "Add verification note"}</button></div></form></div></section>;
}
