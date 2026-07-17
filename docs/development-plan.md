# The Vault Architect — Development Plan

## MVP scope

The MVP should demonstrate a complete, narrow workflow:

- Create or edit a component blueprint.
- Store linked requirements and architectural decisions.
- Generate a structured implementation plan with tasks, constraints, and acceptance criteria.
- Require explicit human approval.
- Hand the approved context to Codex through a replaceable integration boundary.
- Record the implementation result, changed files, and verification evidence.
- Present the full trace from intent to result in a simple interface.

## Current implementation status

The approved TypeScript monorepo is implemented with React/Vite/Tailwind, Fastify, SQLite, shared Zod schemas, deterministic prompt generation, Ollama and mock provider adapters, packet export, and focused Vitest coverage. The current demo path is:

```text
Brief → analysis provider/model selection → validated proposal → human approval → prompt → creation provider/model selection → execution → verification/export
```

Provider selections are ephemeral and per operation. The live Ollama catalog is manually refreshed, cloud-tagged models are hidden, and the deterministic mock remains selectable when Ollama is unavailable.

Stage 6 authority-boundary migration is implemented: enrichment can discover but cannot authorize, registry policy is explicit and hash-pinned, and the orchestrator blocks providers until registry validation passes. Unsupported, deprecated, disabled, conflicting, or version-drifted requests return `review-required` without packet creation or persistence.

Out of scope for the first demo: multi-tenant collaboration, production-grade permissions, autonomous unreviewed merges, broad IDE support, complex graph analytics, and a large plugin marketplace.

## Development phases

### Phase 1 — Foundation

- Confirm the runtime, language, UI approach, and storage format.
- Initialize version control and project metadata.
- Define the domain schema for artifacts, relationships, plans, runs, and evidence.
- Add repository instructions, formatting, linting, and a minimal test harness.
- Build a thin vertical slice with fixture data before adding AI calls.

### Phase 2 — Core functionality

- Implement artifact creation and editing.
- Implement linking between blueprints, requirements, decisions, tasks, and evidence.
- Generate deterministic plans from structured inputs.
- Add approval, status, revision, and validation behavior.
- Persist records in a human-readable, versionable format.

### Phase 3 — AI/Codex integration

- Define a provider-neutral orchestration interface.
- Build the Codex context packager with strict scope and explicit constraints.
- Add model prompts or structured requests for plan generation and implementation.
- Capture model outputs, tool actions, diffs, and verification results.
- Add safeguards for missing context, scope expansion, secrets, and destructive operations.

### Earlier roadmap milestone — User experience

- Add an architecture overview.
- Add blueprint and decision editing.
- Add a plan review and approval screen.
- Add execution status, diff summary, and verification evidence.
- Make the end-to-end demo understandable without explaining internal code.

### Phase 5 — Demo preparation

- Seed one realistic example component and its architectural decisions.
- Script a repeatable happy-path demo and one human-approval intervention.
- Validate clean setup from a fresh checkout.
- Add concise README, screenshots or recording, and known limitations.
- Freeze scope and focus on reliability, latency, and clarity.

### Implemented local-provider milestone

- Add Ollama health and model catalog discovery.
- Support independent analysis and creation model selection.
- Validate selections server-side and preserve provider/model metadata.
- Add accessible catalog refresh and unavailable-model states.
- Preserve deterministic mock execution and Phase 1 packet export behavior.

### Phase 4 — Registry-based domain routing (implemented)

- Classify brief intent before selecting a provider prompt or generator.
- Resolve only through `GeneratorRegistry`; initial definitions are Swift/SpriteKit, Python/Flet, and React/TypeScript.
- Enforce the `0.78` confidence threshold, alternative margin, and classification-evidence compatibility checks.
- Return `Review Required` for unsupported or ambiguous intent without generating or persisting a blueprint.
- Generate and validate Architecture Packet V2 with dynamic components, layers, data flows, and provenance.
- Preserve legacy blueprint records, provider metadata, execution evidence, and Phase 1 packet exports.

The implementation contract and extension rules are in [`registry-generator-engine.md`](registry-generator-engine.md).

## Priority order

1. Domain classification and strict registry routing before any generation.
2. End-to-end traceability from blueprint to verified change.
3. Human approval and scope control.
4. Reliable structured data model and persistence.
5. Useful Codex context packaging and result capture.
6. Clear UI for the demo workflow.
7. Integrations, analytics, and extensibility.

## Technical milestones

- **M1:** Repository initialized with selected stack, CI-ready commands, and documented conventions.
- **M2:** Artifact schema and persistence pass unit tests.
- **M3:** A blueprint can produce a deterministic, reviewable plan.
- **M4:** An approved plan can be submitted to the Codex adapter and produce a recorded run.
- **M5:** Verification evidence is attached to the run and visible in the UI.
- **M6:** A fresh environment can run the scripted demo successfully.

## Testing strategy

- Unit-test parsing, validation, relationship rules, status transitions, and plan generation.
- Use contract tests for the Codex adapter so provider behavior is isolated and mockable.
- Add integration tests for persistence, approval gates, execution records, and verification capture.
- Add one end-to-end test for the primary demo path.
- Test failure paths: missing requirements, rejected plans, provider errors, partial execution, changed scope, and failed checks.
- Treat generated plans and model outputs as untrusted inputs; test schema validation and prompt/context boundaries.
- Keep a small set of golden fixtures to detect accidental changes in plan structure.

## Deployment considerations

For the MVP, prefer a single deployable service with file or embedded-database persistence and environment-based configuration. Keep secrets out of artifacts and logs. Provide a local development command and a simple hosted demo path. Before production use, add authentication, authorization, encrypted storage, rate limiting, provider isolation, audit retention, and secure sandboxing for code execution.

## Approved and implemented technology

The repository uses a minimal TypeScript full-stack application with a React/Vite web UI, Fastify API, shared Zod validation, SQLite persistence, and replaceable provider adapters. The implementation keeps provider-specific request formats behind the API/provider boundary and leaves future remote providers, sandboxed code mutation, and team collaboration outside the MVP.
