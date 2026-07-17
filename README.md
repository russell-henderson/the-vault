<img width="1875" height="928" alt="image" src="https://github.com/user-attachments/assets/631b3d1e-d069-417d-9cfc-59c121a61f57" />


# The Vault Architect

The Vault Architect is an AI-native architecture workflow. It turns a human brief into a validated blueprint, a reviewable architecture packet, a provider-specific execution result, and a traceable verification record.

## What the product does

Vault Architect gives an engineer a visible handoff between architecture and AI-assisted implementation:

```text
Brief → AI blueprint proposal → Human approval → Compile prompt → Execute locally → Review evidence
```

The human remains responsible for the specification and verification. Ollama is supported as a local provider; the deterministic mock remains available as an explicit, labeled fallback.

## Technology stack

- React, TypeScript, Vite, and Tailwind CSS
- Node.js, TypeScript, and Fastify
- SQLite with a typed repository abstraction
- Zod for shared validation
- Provider-neutral AI adapter with Ollama and deterministic mock providers

## Local Ollama setup

Install Ollama separately, start it, and pull a model:

```bash
ollama serve
ollama pull llama3.2:3b
ollama pull dolphin3:8b
```

Use `.env.example` as a reference, then set the variables in the API process. PowerShell example:

```powershell
$env:AI_PROVIDER="ollama"
$env:OLLAMA_BASE_URL="http://localhost:11434"
$env:OLLAMA_ANALYSIS_MODEL="llama3.2:3b"
$env:OLLAMA_CREATION_MODEL="dolphin3:8b"
npm run dev:api
```

POSIX shell example:

```bash
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_ANALYSIS_MODEL=llama3.2:3b
OLLAMA_CREATION_MODEL=dolphin3:8b
npm run dev:api
```

The dashboard shows both configured model roles and refreshes the live local catalog on startup. Use **Refresh catalog** after pulling a new model; cloud-tagged models remain hidden. `llama3.2:3b` handles fast structured analysis and blueprint proposals; `dolphin3:8b` handles creation/execution artifacts. If Ollama is unavailable, choose **Deterministic mock** in either role. The fallback is surfaced in the proposal and execution metadata; it is never presented as an Ollama response.

## Current workflow

The current demo implements:

```text
Brief → structured blueprint proposal → Zod validation → SQLite persistence → architecture packet → deterministic prompt → provider execution → verification record
```

### Phase 4 domain-aware routing

Proposal generation now resolves intent before a prompt is built. `GeneratorRegistry` is the sole authority for the initial stacks:

- `swift-spritekit` — mobile physics, Swift/SpriteKit, scene and physics components.
- `python-flet` — desktop UI, Python/Flet, view, event, state, and persistence components.
- `react-typescript` — web dashboard, React/TypeScript, API, accessibility, and persistence components.

The classifier ranks registered capabilities using the brief’s domain signals and applies a confidence and alternative-margin threshold. Unsupported or ambiguous intent returns `Review Required`; it never falls back to React/Tailwind or another template, and no provider prompt or blueprint is saved. A successful proposal carries a versioned dynamic Architecture Packet with component definitions, layers, data flows, validation, and provenance links. See [`docs/architecture.md`](docs/architecture.md) and [`docs/registry-generator-engine.md`](docs/registry-generator-engine.md).

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

For a presentation-ready local demo, run `npm run seed:demo` once after installation. It creates the realistic **AI Dashboard Analytics Panel** blueprint and its architecture packet if it does not already exist.

## Three-minute demo workflow

1. Open the dashboard and select **Start with a brief**.
2. Refresh the catalog if needed, choose an analysis model, and submit the seeded analytics-panel brief using Ollama or the deterministic mock.
3. Review the generated blueprint, files-to-touch, constraints, and acceptance checks.
4. Select **Approve & save blueprint**.
5. Select **Compile prompt**, choose a creation model, then select **Launch execution**.
6. Review provider metadata, the generated packet, and the stage rail.
7. Add a verification note documenting what was checked.

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

Generate a blueprint proposal:

```bash
curl -X POST http://localhost:3001/api/blueprint-proposals \
  -H "content-type: application/json" \
  -d '{"brief":"Build an accessible analytics dashboard panel with loading, error, empty, and ready states.","provider":"configured"}'
```

Choose a specific analysis model:

```bash
curl -X POST http://localhost:3001/api/blueprint-proposals \
  -H "content-type: application/json" \
  -d '{"brief":"Build an accessible analytics dashboard panel.","analysis":{"provider":"ollama","model":"llama3.2:3b"}}'
```

Choose a specific creation model:

```bash
curl -X POST http://localhost:3001/api/executions \
  -H "content-type: application/json" \
  -d '{"promptArtifactId":"<PROMPT_ARTIFACT_ID>","creation":{"provider":"mock","model":"deterministic-local"}}'
```

Check local provider health:

```bash
curl http://localhost:3001/api/providers/status
```

List selectable local models:

```bash
curl http://localhost:3001/api/providers/models
```

Analysis and creation model choices are per operation and are not persisted to blueprints. The API validates each Ollama selection against the current local catalog, so removed or cloud-tagged models cannot run silently.

## Workspace layout

- `apps/api` — Fastify API and typed SQLite repository.
- `apps/web` — minimal React/Vite/Tailwind scaffold.
- `packages/shared` — Zod schemas and shared domain types.
- `packages/prompts` — deterministic Codex prompt generation.
- `tests` — unit and repository tests.
- `docs` — architecture and planning documents.
