import { app, shell } from "electron";
import path from "node:path";

let activeCompanion;

async function openPairingSession() {
  if (activeCompanion) await activeCompanion.close();
  const { startCompanion } = await import("@the-vault/api/dist/companion-server.js");
  activeCompanion = await startCompanion({
    databasePath: path.join(app.getPath("userData"), "vault.db"),
    openBrowser: (url) => { void shell.openExternal(url); }
  });
}

function isProtocolInvocation(values) { return values.some((value) => value === "vault-companion://open" || value.startsWith("vault-companion://open/")); }

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) app.quit();
else {
  app.setAsDefaultProtocolClient("vault-companion");
  app.on("second-instance", (_event, commandLine) => { if (isProtocolInvocation(commandLine)) void openPairingSession(); });
  app.on("open-url", (event, url) => { event.preventDefault(); if (isProtocolInvocation([url])) void openPairingSession(); });
  app.whenReady().then(openPairingSession).catch((error) => { console.error("Unable to start Vault Companion", error); app.quit(); });
  app.on("before-quit", () => { void activeCompanion?.close(); });
}
