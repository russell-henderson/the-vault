# ADR-002: Runtime-configured local companion connection

## Decision

Keep the Vercel deployment static and connect it at runtime to a Windows loopback companion or a Vault-compatible HTTPS API. The companion binds only to `127.0.0.1`, pairs through an URL fragment, and requires the exact production origin plus a short-lived bearer token on every API route.

## Consequences

No user workflow data is deployed to Vercel. Browser sessions must pair before loading API-backed views, Chromium users may grant Local Network Access, and custom API operators must implement the connection handshake and their own secure hosting controls.
