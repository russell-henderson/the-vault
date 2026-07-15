# The Vault Architect

The Vault Architect is an AI-native architecture workflow. It turns a structured component blueprint into a validated, persisted, deterministic Codex-ready prompt and a traceable execution record.

## Milestone 1

This milestone implements:

```text
Blueprint → Zod validation → SQLite persistence → deterministic prompt → execution record
```

External AI APIs are intentionally not connected yet. The API creates a prompt artifact and a pending execution record so the future Codex adapter has a stable boundary.

## Requirements

- Node.js 20+
- npm 10+

## Run locally

```bash
npm install
npm test
npm run typecheck
npm run build
```

Start the API and web app in separate terminals:

```bash
npm run dev:api
npm run dev:web
```

The API listens on `http://localhost:3001` and stores SQLite data at `apps/api/data/vault.db`. Set `VAULT_DATABASE_PATH` to override the database path.

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
