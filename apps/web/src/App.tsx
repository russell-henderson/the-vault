import { useEffect, useState } from "react";
import type { BlueprintInput, ProviderCatalog, ProviderStatus } from "@the-vault/shared";
import { Layout } from "./components/Layout";
import { api } from "./lib/api";
import { Dashboard } from "./pages/Dashboard";
import { BlueprintCreate } from "./pages/BlueprintCreate";
import { BlueprintDetail } from "./pages/BlueprintDetail";

function currentPath() { return window.location.hash.replace(/^#/, "") || "/dashboard"; }

export function App() {
  const [path, setPath] = useState(currentPath); const [blueprints, setBlueprints] = useState<Awaited<ReturnType<typeof api.listBlueprints>>>([]); const [providerStatus, setProviderStatus] = useState<ProviderStatus>(); const [catalog, setCatalog] = useState<ProviderCatalog>(); const [catalogLoading, setCatalogLoading] = useState(true); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { const onHashChange = () => setPath(currentPath()); window.addEventListener("hashchange", onHashChange); void Promise.all([api.listBlueprints(), api.getProviderStatus()]).then(([nextBlueprints, nextProvider]) => { setBlueprints(nextBlueprints); setProviderStatus(nextProvider); }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to reach API")).finally(() => setLoading(false)); void api.getProviderCatalog().then(setCatalog).catch(() => undefined).finally(() => setCatalogLoading(false)); return () => window.removeEventListener("hashchange", onHashChange); }, []);
  async function refreshCatalog(): Promise<boolean> { setCatalogLoading(true); try { setCatalog(await api.getProviderCatalog()); return true; } catch { return false; } finally { setCatalogLoading(false); } }
  const navigate = (nextPath: string) => { window.location.hash = nextPath; setPath(nextPath); };
  async function createBlueprint(input: BlueprintInput) { const blueprint = await api.createBlueprint(input); setBlueprints((current) => [blueprint, ...current]); navigate(`/blueprints/${blueprint.id}`); }
  let content = <Dashboard blueprints={blueprints} providerStatus={providerStatus} loading={loading} error={error} onNavigate={navigate} />;
  if (path === "/blueprints/new") content = <BlueprintCreate providerStatus={providerStatus} catalog={catalog} catalogLoading={catalogLoading} onRefreshCatalog={refreshCatalog} onSubmit={createBlueprint} onCancel={() => navigate("/dashboard")} />;
  else if (path.startsWith("/blueprints/")) content = <BlueprintDetail id={path.split("/")[2]} catalog={catalog} catalogLoading={catalogLoading} onRefreshCatalog={refreshCatalog} onNavigate={navigate} />;
  return <Layout providerStatus={providerStatus} catalog={catalog} onNavigate={navigate}>{content}</Layout>;
}
