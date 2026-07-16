import { useEffect, useState } from "react";
import type { BlueprintInput } from "@the-vault/shared";
import type { ProviderStatus } from "@the-vault/shared";
import { Layout } from "./components/Layout";
import { api } from "./lib/api";
import { Dashboard } from "./pages/Dashboard";
import { BlueprintCreate } from "./pages/BlueprintCreate";
import { BlueprintDetail } from "./pages/BlueprintDetail";

function currentPath() { return window.location.hash.replace(/^#/, "") || "/dashboard"; }

export function App() {
  const [path, setPath] = useState(currentPath); const [blueprints, setBlueprints] = useState<Awaited<ReturnType<typeof api.listBlueprints>>>([]); const [providerStatus, setProviderStatus] = useState<ProviderStatus>(); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { const onHashChange = () => setPath(currentPath()); window.addEventListener("hashchange", onHashChange); void Promise.all([api.listBlueprints(), api.getProviderStatus()]).then(([nextBlueprints, nextProvider]) => { setBlueprints(nextBlueprints); setProviderStatus(nextProvider); }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to reach API")).finally(() => setLoading(false)); return () => window.removeEventListener("hashchange", onHashChange); }, []);
  const navigate = (nextPath: string) => { window.location.hash = nextPath; setPath(nextPath); };
  async function createBlueprint(input: BlueprintInput) { const blueprint = await api.createBlueprint(input); setBlueprints((current) => [blueprint, ...current]); navigate(`/blueprints/${blueprint.id}`); }
  let content = <Dashboard blueprints={blueprints} providerStatus={providerStatus} loading={loading} error={error} onNavigate={navigate} />;
  if (path === "/blueprints/new") content = <BlueprintCreate providerStatus={providerStatus} onSubmit={createBlueprint} onCancel={() => navigate("/dashboard")} />;
  else if (path.startsWith("/blueprints/")) content = <BlueprintDetail id={path.split("/")[2]} onNavigate={navigate} />;
  return <Layout providerStatus={providerStatus} onNavigate={navigate}>{content}</Layout>;
}
