export type ConnectionProfile = {
  kind: "companion" | "custom";
  baseUrl: string;
  token?: string;
};

export type ConnectionInfo = {
  contractVersion: number;
  authentication: "bearer-required" | "optional";
  providers: { localOnly: boolean; embeddingAvailable: boolean };
};

const sessionKey = "vault-connection";
const customPreferencesKey = "vault-custom-connection";

function browserStorage(kind: "sessionStorage" | "localStorage"): Storage | undefined {
  return typeof window === "undefined" ? undefined : window[kind];
}

export function isCompanionUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" && url.hostname === "127.0.0.1" && /^\d+$/.test(url.port) && Number(url.port) > 0;
  } catch { return false; }
}

export function isCustomUrl(value: string): boolean {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

export function readConnection(): ConnectionProfile | undefined {
  const raw = browserStorage("sessionStorage")?.getItem(sessionKey);
  if (!raw) return undefined;
  try {
    const profile = JSON.parse(raw) as ConnectionProfile;
    if ((profile.kind === "companion" && isCompanionUrl(profile.baseUrl) && profile.token) || (profile.kind === "custom" && isCustomUrl(profile.baseUrl))) return profile;
  } catch { /* discard invalid browser state */ }
  browserStorage("sessionStorage")?.removeItem(sessionKey);
  return undefined;
}

export function writeConnection(profile: ConnectionProfile): void {
  browserStorage("sessionStorage")?.setItem(sessionKey, JSON.stringify(profile));
  if (profile.kind === "custom") browserStorage("localStorage")?.setItem(customPreferencesKey, JSON.stringify({ baseUrl: profile.baseUrl }));
}

export function clearConnection(): void { browserStorage("sessionStorage")?.removeItem(sessionKey); }

export function readCustomEndpoint(): string {
  const raw = browserStorage("localStorage")?.getItem(customPreferencesKey);
  if (!raw) return "";
  try { return typeof (JSON.parse(raw) as { baseUrl?: unknown }).baseUrl === "string" ? (JSON.parse(raw) as { baseUrl: string }).baseUrl : ""; } catch { return ""; }
}

export function consumePairingFragment(): ConnectionProfile | undefined {
  if (typeof window === "undefined") return undefined;
  const hash = window.location.hash.replace(/^#/, "");
  const [path, query = ""] = hash.split("?");
  if (path !== "/connect") return undefined;
  const params = new URLSearchParams(query);
  const endpoint = params.get("endpoint") ?? "";
  const token = params.get("token") ?? "";
  if (!isCompanionUrl(endpoint) || !token) return undefined;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#/connect`);
  return { kind: "companion", baseUrl: endpoint, token };
}
