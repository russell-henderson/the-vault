# Vault Architect — Implemented Demo Architecture

## End-to-end flow

```text
Human
  │ writes a natural-language brief
  ▼
React web workspace
  │ POST /api/blueprint-proposals
  ▼
Fastify API + shared Zod schemas
  │ Ollama or explicit mock proposal
  ▼
Validated blueprint + architecture packet
  │ human approval
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
Ollama or mock AI provider
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

- `Dashboard` — command-center vault, provider signal, metrics, and blueprint library.
- `BriefComposer` and `BlueprintProposal` — local brief generation, provider choice, and human review.
- `BlueprintCreate` and `BlueprintForm` — structured, client-validated authoring.
- `BlueprintDetail` — specification, prompt, execution, result, and verification workflow.
- `PromptPreview`, `ExecutionLauncher`, `ExecutionResult`, and `VerificationPanel` — visible evidence layers.

### Backend

- Fastify routes for blueprints, prompts, executions, and verification notes.
- `VaultRepository` for SQLite persistence and additive execution-record migration.
- `ExecutionService` for provider validation and pending/running/completed/failed transitions.
- `AiProvider` interface with `OllamaAiProvider` and `MockAiProvider` implementations.

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
