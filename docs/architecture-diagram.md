# Vault Architect — Implemented Demo Architecture

## End-to-end flow

```text
Human
  │ creates structured component blueprint
  ▼
React web workspace
  │ POST /api/blueprints
  ▼
Fastify API + shared Zod schemas
  │ validate and persist
  ▼
SQLite typed repository
  │ blueprint → deterministic prompt artifact
  ▼
Prompt compiler
  │ POST /api/executions
  ▼
Execution service
  │ provider-neutral boundary
  ▼
Mock AI provider
  │ normalized output
  ▼
Execution evidence
  │ status, prompt, output, artifact metadata, timestamps
  ▼
Human verification
  │ POST /api/executions/:id/verify
  ▼
Reviewable execution history
```

## Implemented components

### Frontend

- `Dashboard` — blueprint library and empty state.
- `BlueprintCreate` and `BlueprintForm` — structured, client-validated authoring.
- `BlueprintDetail` — specification, prompt, execution, result, and verification workflow.
- `PromptPreview`, `ExecutionLauncher`, `ExecutionResult`, and `VerificationPanel` — visible evidence layers.

### Backend

- Fastify routes for blueprints, prompts, executions, and verification notes.
- `VaultRepository` for SQLite persistence and additive execution-record migration.
- `ExecutionService` for provider validation and pending/running/completed/failed transitions.
- `AiProvider` interface with `MockAiProvider` as the current no-network implementation.

### Data ownership

```text
Blueprint
  └── PromptArtifact
        └── ExecutionRecord
              ├── inputPrompt
              ├── generatedOutput
              ├── artifactType / artifactLocation
              ├── lifecycle timestamps
              └── verificationNotes
```

The provider is not allowed to redefine the blueprint or silently expand scope. The application owns intent, persistence, lifecycle, and verification; a future provider will own only normalized AI execution.
