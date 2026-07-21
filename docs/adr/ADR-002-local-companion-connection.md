# ADR-002: Runtime-configured local companion connection

## Decision

Keep the Vercel deployment static and connect saved workflows at runtime to a Windows loopback companion or a Vault-compatible HTTPS API. The companion binds only to `127.0.0.1`, pairs through an URL fragment, and requires the exact production origin plus a short-lived bearer token on every API route. Unpaired visitors may instead use a browser-only ephemeral workspace with Local Ollama or OpenRouter OAuth; it has no Vault API or persistence access. OpenRouter also permits a user-supplied existing key and manual model ID when OAuth or catalog discovery is unavailable; those values are memory-only.

## Consequences

No user workflow data is deployed to Vercel. The installed companion presents the paired hosted workspace in an Electron window, with its loopback API and per-user SQLite database running for that window's lifetime. The Windows installer registers `vault-companion://open`, so the hosted connection screen can bring the installed application forward. Browser sessions must pair before loading API-backed views, Chromium users may grant Local Network Access, and custom API operators must implement the connection handshake and their own secure hosting controls. Ephemeral provider credentials and results are intentionally short-lived: the OAuth verifier is removed after callback, access credentials are memory-only, and a reload discards generated work.
