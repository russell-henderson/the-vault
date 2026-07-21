import { app, BrowserWindow, dialog } from "electron";
import path from "node:path";
import { appendFile, mkdir } from "node:fs/promises";

let activeCompanion;
let companionWindow;

function vaultDirectory() {
  const localAppData = process.env.LOCALAPPDATA?.trim();
  return path.join(localAppData || app.getPath("appData"), "The Vault Architect");
}

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
  const dataDirectory = vaultDirectory();
  await mkdir(dataDirectory, { recursive: true });
  const { startCompanion } = await import("@the-vault/api/dist/companion-server.js");
  activeCompanion = await startCompanion({
    databasePath: path.join(dataDirectory, "vault.db"),
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
    const details = error instanceof Error ? error.message : "Unknown local service error.";
    const logPath = path.join(vaultDirectory(), "companion.log");
    void appendFile(logPath, `[${new Date().toISOString()}] ${error instanceof Error && error.stack ? error.stack : details}\n`).catch(() => undefined);
    dialog.showErrorBox("Vault Companion could not start", `The local Vault service could not start: ${details}\n\nDiagnostic log: ${logPath}`);
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
