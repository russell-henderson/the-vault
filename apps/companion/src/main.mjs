import { app, BrowserWindow, dialog } from "electron";
import path from "node:path";

let activeCompanion;
let companionWindow;

function ensureCompanionWindow() {
  if (companionWindow && !companionWindow.isDestroyed()) return companionWindow;
  companionWindow = new BrowserWindow({
    width: 1360,
    height: 920,
    minWidth: 960,
    minHeight: 680,
    title: "The Vault Architect — Local Companion",
    webPreferences: { contextIsolation: true, nodeIntegration: false }
  });
  companionWindow.on("closed", () => { companionWindow = undefined; });
  return companionWindow;
}

function showCompanionWindow() {
  const window = ensureCompanionWindow();
  if (window.isMinimized()) window.restore();
  window.show();
  window.focus();
  return window;
}

async function openPairingSession() {
  const window = showCompanionWindow();
  if (activeCompanion) await activeCompanion.close();
  const { startCompanion } = await import("@the-vault/api/dist/companion-server.js");
  activeCompanion = await startCompanion({
    databasePath: path.join(app.getPath("userData"), "vault.db"),
    // The paired Vercel workspace runs inside the installed app. The URL fragment
    // keeps the endpoint and bearer token out of the Vercel request itself.
    openBrowser: (url) => {
      void window.loadURL(url).catch((error) => {
        console.error("Unable to load the paired Vault workspace", error);
        dialog.showErrorBox("Vault workspace could not load", "Check your internet connection, then reopen Vault Companion.");
      });
    }
  });
}

function isProtocolInvocation(values) { return values.some((value) => value === "vault-companion://open" || value.startsWith("vault-companion://open/")); }

function startOrShowCompanion() {
  void openPairingSession().catch((error) => {
    console.error("Unable to start Vault Companion", error);
    dialog.showErrorBox("Vault Companion could not start", "The local Vault service could not start. Close the app and try again.");
  });
}

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) app.quit();
else {
  app.setAsDefaultProtocolClient("vault-companion");
  app.on("second-instance", (_event, commandLine) => { if (isProtocolInvocation(commandLine)) startOrShowCompanion(); else showCompanionWindow(); });
  app.on("open-url", (event, url) => { event.preventDefault(); if (isProtocolInvocation([url])) startOrShowCompanion(); });
  app.whenReady().then(startOrShowCompanion);
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) startOrShowCompanion(); });
  app.on("before-quit", () => { void activeCompanion?.close(); });
}
