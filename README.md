# The Vault Architect

The Vault Architect is an AI-native architecture workflow. It turns structured human intent into a validated, persisted, deterministic Codex-ready prompt, a mock execution result, and a traceable verification record.

## What the product does

Vault Architect gives an engineer a visible handoff between architecture and AI-assisted implementation:

```text
Blueprint → Validate → Compile prompt → Launch mock execution → Review evidence
```

The human remains responsible for the specification and verification. The current demo uses a local mock provider; no external AI key or network request is required.

## Technology stack

- React, TypeScript, Vite, and Tailwind CSS
- Node.js, TypeScript, and Fastify
- SQLite with a typed repository abstraction
- Zod for shared validation
- Provider-neutral AI adapter with a deterministic mock provider

## Milestone 1

This milestone implements:

```text
Blueprint → Zod validation → SQLite persistence → deterministic prompt → execution record
```

External AI APIs are intentionally not connected. The API creates a prompt artifact and execution evidence through the mock provider.

## Requirements

- Node.js 20+
- npm 10+

## Run locally

```bash
npm install
npm test
npm run typecheck
npm run build
npm run seed:demo
```

Start the API and web app in separate terminals:

```bash
npm run dev:api
npm run dev:web
```

The API listens on `http://localhost:3001` and stores SQLite data at `apps/api/data/vault.db`. Set `VAULT_DATABASE_PATH` to override the database path.

For a presentation-ready local demo, run `npm run seed:demo` once after installation. It creates the realistic **AI Dashboard Analytics Panel** blueprint if it does not already exist.

## Three-minute demo workflow

1. Open the dashboard and select **AI Dashboard Analytics Panel**, or create a new blueprint.
2. Review the structured architecture, technology, dependencies, UI, and constraints.
3. Select **Generate Codex prompt** and inspect the deterministic prompt artifact.
4. Select **Launch execution** to run the local mock provider.
5. Review the generated implementation result and execution status.
6. Add a verification note documenting what was checked.

## API examples

Create a blueprint:

```bash
curl -X POST http://localhost:3001/api/blueprints \
  -H "content-type: application/json" \
  -d '{"name":"FeatureFlagPanel","description":"A dashboard panel for editing feature flags.","targetPath":"src/components/FeatureFlagPanel.tsx","language":"TypeScript","framework":"React","dependencies":["feature-flag-api"],"architectureOverview":"A presentational panel that consumes feature flag data.","coreLogic":"Render loading, error, and ready states without owning persistence.","layoutDesign":"Keyboard-accessible form controls with inline validation.","constraints":["Do not persist server state in the component.","Support keyboard navigation."]}'
```

Generate the prompt and execution record:

```bash
curl -X POST http://localhost:3001/api/blueprints/<BLUEPRINT_ID>/generate-prompt
```

## Workspace layout

- `apps/api` — Fastify API and typed SQLite repository.
- `apps/web` — minimal React/Vite/Tailwind scaffold.
- `packages/shared` — Zod schemas and shared domain types.
- `packages/prompts` — deterministic Codex prompt generation.
- `tests` — unit and repository tests.
- `docs` — architecture and planning documents.
