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

### Phase 4 — User experience

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

## Priority order

1. End-to-end traceability from blueprint to verified change.
2. Human approval and scope control.
3. Reliable structured data model and persistence.
4. Useful Codex context packaging and result capture.
5. Clear UI for the demo workflow.
6. Integrations, analytics, and extensibility.

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

## Initial technology recommendation for approval

Because the repository has no pre-existing stack, use a minimal TypeScript full-stack application with a lightweight web UI, a small server/API layer, schema validation, and file-backed or embedded persistence. This keeps the project approachable for Build Week while leaving the Codex adapter and storage layer replaceable. The exact framework and hosting target should be approved before implementation begins.
