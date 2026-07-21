import { useState } from "react";
import { useConnection } from "../components/ConnectionProvider";
import { isCustomUrl, readCustomEndpoint } from "../lib/connection";
import { api } from "../lib/api";

export function Connect({ onConnected }: { onConnected: () => void }) {
  const { connect, disconnect } = useConnection();
  const [endpoint, setEndpoint] = useState(readCustomEndpoint);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function connectCustom() {
    if (!isCustomUrl(endpoint)) { setMessage("Enter a Vault-compatible HTTPS endpoint."); return; }
    setBusy(true); setMessage("");
    const profile = { kind: "custom" as const, baseUrl: endpoint.replace(/\/$/, ""), ...(token.trim() ? { token: token.trim() } : {}) };
    try { connect(profile); await api.getConnectionInfo(); onConnected(); }
    catch (error) { disconnect(); setMessage(error instanceof Error ? error.message : "Unable to validate that API."); }
    finally { setBusy(false); }
  }

  return <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16 text-slate-100">
    <p className="eyebrow">THE VAULT ARCHITECT</p><h1 className="page-title mt-3">Connect your Vault</h1>
    <p className="page-subtitle mt-3">Your Vercel workspace needs a local companion or a Vault-compatible API before it can read or create blueprints.</p>
    <section className="panel mt-8 space-y-4 p-6"><h2 className="section-title">Local Companion <span className="text-sm text-cyan-300">Recommended</span></h2>
      <p className="text-sm text-slate-400">Start the Windows companion, then use one-click pairing. Your database and Ollama requests stay on this device.</p>
      <div className="flex flex-wrap gap-3"><a className="button-primary" href="vault-companion://open">Connect Local Companion</a><a className="button-secondary" href="https://github.com/russell-henderson/the-vault/releases">Install Windows Companion</a></div>
    </section>
    <section className="panel mt-5 space-y-4 p-6"><h2 className="section-title">Custom API</h2><p className="text-sm text-slate-400">For an advanced, Vault-compatible HTTPS deployment. Tokens are retained only for this browser tab.</p>
      <label className="provider-select"><span>HTTPS API endpoint</span><input value={endpoint} onChange={(event) => setEndpoint(event.target.value)} placeholder="https://vault-api.example.com" /></label>
      <label className="provider-select"><span>Bearer token (optional)</span><input type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Stored for this tab only" /></label>
      <button className="button-primary" disabled={busy} onClick={() => void connectCustom()}>{busy ? "Checking connection…" : "Connect custom API"}</button>
      {message && <p role="alert" className="text-sm text-amber-200">{message}</p>}
    </section>
    <p className="mt-6 text-xs text-slate-500">Chromium may ask permission for this secure site to connect to the local companion. Allow Local Network Access when prompted.</p>
  </main>;
}
