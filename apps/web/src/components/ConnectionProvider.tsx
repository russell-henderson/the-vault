import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { clearConnection, consumePairingFragment, readConnection, writeConnection, type ConnectionProfile } from "../lib/connection";
import { setApiConnection } from "../lib/api";

type ConnectionContextValue = { profile?: ConnectionProfile; connect: (profile: ConnectionProfile) => void; disconnect: () => void };
const ConnectionContext = createContext<ConnectionContextValue | undefined>(undefined);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ConnectionProfile | undefined>(() => consumePairingFragment() ?? readConnection());
  const value = useMemo<ConnectionContextValue>(() => ({
    profile,
    connect: (next) => { setApiConnection(next); writeConnection(next); setProfile(next); },
    disconnect: () => { setApiConnection(undefined); clearConnection(); setProfile(undefined); }
  }), [profile]);
  setApiConnection(profile);
  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
}

export function useConnection(): ConnectionContextValue {
  const value = useContext(ConnectionContext);
  if (!value) throw new Error("ConnectionProvider is required");
  return value;
}
