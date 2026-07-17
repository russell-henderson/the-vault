# The Vault Architect — MVP System Design

## Design goals

- Demonstrate the complete blueprint-to-review journey quickly.
- Keep all human intent and AI output traceable.
- Make AI integration replaceable and testable.
- Use a local-first architecture that is easy to run during a hackathon.
- Avoid building an execution sandbox or enterprise platform before the workflow is proven.

## Recommended stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, and a small component library or accessible primitives.
- **Backend:** Node.js with TypeScript and Fastify. Use a single language across the product to maximize Build Week velocity and share domain types.
- **Validation:** Zod schemas shared between API boundaries and the frontend.
- **Persistence:** SQLite accessed through the current thin typed repository layer. Keep migrations explicit and additive.
- **AI:** An internal provider-neutral `AiProvider` interface with Ollama and deterministic mock adapters. The adapter receives a bounded brief or prompt and returns normalized, schema-validated results.
- **Testing:** Vitest for unit and integration tests, plus one browser-level end-to-end path with a lightweight test runner once the UI exists.
- **Deployment:** One Node service serving the built frontend and API, with a local SQLite file and environment-based secrets.

This stack keeps the frontend, backend, schemas, tests, and orchestration logic in TypeScript. FastAPI remains a possible future choice if Python-based evaluation or agent tooling becomes a primary requirement.

## Frontend architecture

Use a feature-oriented React application:

```text
src/
  app/                 routing, providers, global layout
  features/
    blueprints/        authoring, validation, preview
    executions/        prompt/run status and review
    artifacts/         generated output and verification views
  components/          reusable UI primitives
  lib/                 API client, formatting, shared helpers
  types/               API-facing types generated or imported from schemas
```

The primary screen should be a guided workspace with three clear stages: Blueprint, Prepare, and Review. The UI should make the trace visible rather than hiding it behind separate administration pages.

Use server calls for persisted state. Keep only ephemeral form state and view state in the browser. The frontend should display validation warnings before prompt generation and should never imply that generated output is approved automatically.

## Backend architecture

Use a modular monolith:

```text
server/
  routes/              HTTP endpoints and request mapping
  domain/              blueprint, execution, artifact, verification rules
  services/            validation, prompt generation, orchestration
  repositories/        SQLite persistence
  providers/           Ollama adapter, configured provider, and deterministic mock adapter
  schemas/             Zod request/response and persisted-record schemas
```

The route layer should be thin. Domain services own status transitions and invariants. Repositories own persistence. Providers should not know about HTTP or UI concerns.

The implemented provider boundary supports two modes: Ollama for local analysis/creation and a deterministic mock that makes offline development, tests, and explicit fallback behavior reliable. Both modes return the same normalized result shape.

## Database schema concept

SQLite tables should model the trace explicitly:

### `blueprints`

Stores identity, source attribution, optional implementation packet, and lifecycle metadata: `id`, `title`, `component_type`, `source`, `source_brief`, `implementation_plan`, `created_at`, and `updated_at`.

### `blueprint_revisions`

Stores immutable submitted content: `id`, `blueprint_id`, `revision_number`, `architecture`, `technology_requirements`, `dependencies`, `state_data_requirements`, `ui_requirements`, `constraints`, `acceptance_criteria`, `created_at`, and `created_by`.

### `prompts`

Stores generated prompt material: `id`, `blueprint_revision_id`, `prompt_text`, `prompt_version`, `generation_metadata`, and `created_at`.

### `executions`

Stores the lifecycle of an AI handoff: `id`, `blueprint_revision_id`, `prompt_id`, `status`, `provider`, `model`, `started_at`, `completed_at`, and `error_summary`.

### `artifacts`

Stores generated output: `id`, `execution_id`, `artifact_type`, `content`, `file_manifest`, `ai_contribution`, and `created_at`.

### `verification_notes`

Stores checks and human review: `id`, `execution_id`, `kind`, `status`, `note`, `source`, and `created_at`.

The MVP can store structured sections as JSON columns where SQLite support and validation are clear. The relationship IDs are more important than premature normalization. Submitted blueprint revisions and generated prompts should be immutable; a new revision creates a new prompt and execution relationship.

## API design

The API should be small and task-oriented:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/blueprints` | Create a blueprint draft |
| `GET` | `/api/blueprints` | List blueprint summaries |
| `GET` | `/api/blueprints/:id` | Retrieve a blueprint and its stored packet metadata |
| `GET` | `/api/providers/status` | Report configured provider health and role defaults |
| `GET` | `/api/providers/models` | Return the current local catalog and deterministic mock option |
| `POST` | `/api/blueprint-proposals` | Generate a validated proposal with an optional analysis selection |
| `POST` | `/api/blueprints/:id/generate-prompt` | Compile a stored blueprint into a prompt artifact |
| `POST` | `/api/executions` | Run a prompt with an optional creation selection |
| `GET` | `/api/executions/:id` | Retrieve prompt, output, artifact, and evidence |
| `POST` | `/api/executions/:id/verify` | Add verification or human review notes |

Every write response should return the record ID, status, and enough metadata for the UI to update without guessing. API errors should distinguish invalid input, invalid state transition, provider failure, and persistence failure.

## Data flow

```text
Blueprint form
  → API validation
  → validated blueprint
  → optional analysis provider/model selection
  → prompt generator
  → stored Codex prompt
  → user approval
  → optional creation provider/model selection
  → execution record
  → AI provider adapter
  → normalized AI contribution/artifact
  → verification notes
  → review timeline
```

The immutable revision is the trace anchor. The system must never overwrite the blueprint content used to generate a prompt or execution record.

## AI integration boundaries

The application should own intent, scope, validation, persistence, approval, and review. The AI provider should own language generation and, only when explicitly supported by a future execution surface, bounded implementation actions.

## Domain-aware generator routing

Before the provider boundary, `ArchitectureOrchestrator` performs strict registry-based dispatch. It classifies the user brief, checks the confidence threshold and alternative margin, resolves a registered generator, and verifies that the classification’s stack, domain, and platform agree with the generator definition. The registry currently exposes Swift/SpriteKit mobile physics, Python/Flet desktop UI, and React/TypeScript web dashboard generators. No generator is a fallback; unresolved intent enters `Review Required` and is not persisted.

The generator returns an additive Architecture Packet V2. The packet uses dynamic component definitions and references those components from architecture layers and data flows, so the same persistence and provenance model can represent physics controllers, desktop event handlers, or web API adapters. The blueprint retains the existing fields for Phase 1/2 compatibility and stores the packet JSON alongside them.

Define an internal interface conceptually like:

```text
AiOrchestrator.run(contextPackage) → AiRunResult
```

`contextPackage` includes the approved blueprint revision, generated prompt, acceptance criteria, repository context selected by the user, and execution constraints. `AiRunResult` includes provider metadata, model metadata when available, response text, structured artifact candidates, requested actions, and warnings.

The adapter must not receive unrestricted workspace access by default. It must not silently expand scope, treat generated output as approved, or write secrets into the execution record. Provider-specific request formats, retries, health checks, and authentication remain inside `providers/`. Ollama blueprint proposals are parsed as JSON and validated against shared schemas before approval or persistence.

Provider selection is validated at the API boundary against the current Ollama catalog for each proposal or execution. `GET /api/providers/models` is manually refreshed by the UI; it filters cloud-tagged entries, always includes the deterministic mock option, and does not persist user selections. A refresh replaces catalog data while the UI preserves valid choices and marks removed choices unavailable.

The current integration returns a generated implementation artifact and file metadata for review. It does not mutate the repository directly; any future code mutation must remain behind explicit approval, scope restrictions, and verification.

## Key invariants

- An execution always references exactly one immutable blueprint revision and prompt.
- An artifact cannot exist without an execution record.
- A run cannot start until its prompt is generated and explicitly approved.
- AI output is labeled proposed until a human marks it reviewed.
- Verification notes are append-only for the MVP.
- Any architectural change requires a new blueprint revision or an explicit recorded decision.
