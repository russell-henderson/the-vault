# The Vault Architect

**v1.0.0 · Local-first architecture orchestration for reviewable AI-assisted development**

The Vault Architect turns a human brief into a bounded, reviewable engineering handoff. It keeps intent, constraints, architecture decisions, generated documents, provider metadata, and verification evidence connected from the first brief through the final artifact.

```text
Brief → Discover → Confirm → Synthesize → Approve → Compile → Stream → Verify
```

The product is deliberately human-governed. Providers propose content; the user confirms the direction, approves the blueprint, reviews generated documents, and records verification evidence.

## What is in the current release

- **Guided architecture workflow:** write a brief, inspect registry-backed recommendations, confirm a generator, and review the proposed Architecture Packet V2 before saving.
- **Authority boundaries:** explicit constraints, unsupported technologies, ambiguous intent, and incompatible generators stop at `Review Required` before provider synthesis or persistence.
- **Provider-neutral generation:** use local Ollama models or the deterministic mock provider. Analysis and creation models can be selected independently.
- **Prompt and execution evidence:** compile deterministic prompt artifacts, launch bounded executions, inspect generated output and provider metadata, and record human verification notes.
- **Real-time document workspace:** generate PRD and core documents through SSE, watch Markdown tokens arrive live, reroll one document without disturbing the others, edit locally, and export Markdown or ZIP bundles.
- **Premium blueprint vault:** manage tags, rename records, delete single or selected blueprints, filter by canonical tags, and personalize cards with browser-local cover art.
- **Local-first cover customization:** PNG, JPEG, and WebP covers are resized in the browser and stored in IndexedDB by blueprint ID. They never enter SQLite, provider prompts, or the server API.
- **Traceable operations:** the API persists blueprints, packets, prompt artifacts, execution records, provider metadata, and verification notes in SQLite.

## Architecture at a glance

```text
React + Vite + Tailwind
  ├─ Dashboard / Brief Composer / Proposal Review
  ├─ Blueprint Detail / Document Workspace
  └─ IndexedDB cover art + client-side exports
          │ HTTP + SSE
Fastify API + shared Zod contracts
  ├─ Discovery and authority orchestration
  ├─ Generator registry and Architecture Packet V2
  ├─ Prompt compilation and execution lifecycle
  └─ SQLite repository
          │ bounded provider adapter
Ollama (local) or deterministic mock
```

Registered generator definitions currently cover:

- `swift-spritekit` — mobile physics with Swift and SpriteKit;
- `python-flet` — desktop UI with Python and Flet;
- `react-typescript` — web dashboards with React and TypeScript/Tailwind.

## Local setup

Requirements: Node.js 20+ and npm 10+.

```bash
npm install
npm run typecheck
npm run build
npm test
```

Start the services in separate terminals:

```bash
npm run dev:api   # http://localhost:3001
npm run dev:web   # http://localhost:5173
```

The API stores SQLite data at `apps/api/data/vault.db`. Set `VAULT_DATABASE_PATH` to use another location.

### Ollama

Ollama is optional. The deterministic mock works without it.

```bash
ollama serve
ollama pull llama3.2:3b
ollama pull dolphin3:8b
```

Configure the API with `.env.example` values or environment variables:

```bash
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_ANALYSIS_MODEL=llama3.2:3b
OLLAMA_CREATION_MODEL=dolphin3:8b
```

The dashboard reports provider health and the active model. Refresh the catalog after pulling a new local model. Cloud-tagged models are excluded from selection.

## Product walkthrough

1. Select **Start with a brief** and describe the intended outcome and constraints.
2. Run discovery, compare registered options, confirm the intended generator, and review the proposal.
3. Select **Approve & save blueprint** to persist the blueprint and Architecture Packet V2.
4. Compile the deterministic prompt artifact and choose the creation provider/model.
5. Generate the PRD and selected core documents, then open the workspace.
6. Review the live SSE stream, edit or reroll a document, and export the completed workspace.
7. Return to the vault to tag, rename, cover, review, or delete blueprint records.

## API surface

| Area | Routes |
| --- | --- |
| Provider state | `GET /api/providers/status`, `GET /api/providers/models` |
| Discovery | `POST /api/architecture-discovery`, `POST /api/blueprint-proposals` |
| Blueprints | `POST/GET /api/blueprints`, `GET/PATCH/DELETE /api/blueprints/:id`, `POST /api/blueprints/bulk-delete` |
| Prompts | `POST /api/blueprints/:id/generate-prompt`, `GET /api/blueprints/:id/prompt` |
| Workspace | `GET /api/blueprints/:id/workspace`, `POST /api/blueprints/:id/generate-core-docs`, `POST /api/blueprints/:id/reroll-doc` |
| Streaming | `GET /api/blueprints/:id/generate/stream?filename=README.md&provider=mock&model=deterministic-local` |
| Execution | `POST /api/executions`, `GET /api/executions/:id`, `POST /api/executions/:id/verify` |

The SSE endpoint emits `data: {"chunk":"..."}` frames and ends with `data: {"status":"DONE"}`. Errors are emitted as structured error events and are shown in the workspace without persisting an incomplete document as completed output.

## Verification status

The release build and static checks pass:

```text
npm run typecheck  ✓
npm run build      ✓
Focused tests      ✓ 19 tests
```

The full suite currently has an environment-specific blocker: 58 tests pass, while 21 database-backed tests cannot load the installed `better-sqlite3` binary because it was compiled for Node ABI 127 and the active runtime requires ABI 147. The application’s live API mutation flow has been verified separately against the running v1.0.0 service.

## Boundaries and non-goals

- No multi-user accounts, permissions, or collaboration model.
- No autonomous repository mutation or unreviewed code merge.
- No unrestricted agent shell or workspace access.
- No server-side persistence for browser-local cover art.
- No claim of complete verification while the native SQLite dependency remains mismatched.

## Documentation

- [Documentation index](docs/README.md)
- [Canonical architecture](docs/architecture.md)
- [Product and development plan](docs/development-plan.md)
- [Demo script](docs/demo-script.md)
- [Submission notes](docs/submission-notes.md)
- [Architecture decision record](docs/adr/ADR-001-authority-model.md)
- [Build log](BUILD_LOG.md)
- [Historical reports](docs/reports/)

## Release

The current local release is `v1.0.0`, merged into local `main`. Remote push and pull-request publication remain intentionally separate actions.
