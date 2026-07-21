# The Vault Architect — Product and Development Plan

**Status:** Canonical product scope and delivery plan
**Last reviewed:** 2026-07-19

This document consolidates the former MVP definition and development plan. Architecture and authority rules are canonical in [architecture.md](architecture.md).

## 1. Product objective

Vault Architect creates a durable, reviewable handoff between human architectural intent and AI-assisted implementation.

~~~text
Human brief
  → validated architecture direction
  → approved blueprint and packet
  → deterministic implementation prompt
  → provider execution
  → artifact and verification evidence
~~~

The MVP is for one technical user in one local workspace. It is not a team collaboration product or an unrestricted autonomous agent.

## 2. Included scope

- Natural-language brief composition.
- Structured blueprint authoring and validation.
- Registry-backed architecture discovery.
- High-confidence proposal auto-advance with review-required fallback and explicit generator confirmation.
- Authority-bound final synthesis.
- Architecture Packet V2 with dynamic components and provenance.
- Human review and approval of generated proposals.
- Deterministic prompt compilation.
- Independent analysis and creation provider/model selection.
- Ollama local provider, deterministic mock provider, and an explicit OpenRouter embedding evaluation adapter.
- SQLite persistence for blueprints, packets, prompts, executions, and notes.
- Execution lifecycle and normalized provider metadata.
- Human verification notes.
- Markdown copy and full-trace JSON export.
- Multi-document workspace with PRD preview; selectable architecture, API, data-model, component, development-plan, testing-strategy, deployment, and troubleshooting documents; isolated rerolls; real-time SSE streaming; and client-side Markdown/ZIP export.
- Reliable blueprint vault mutations with canonical tags, authoritative state synchronization, and confirmed bulk deletion.
- Authored dashboard masthead/status ribbon, persona-driven SSE generation feedback, and optional browser-local IndexedDB cover art for blueprint cards.
- Review-required behavior for unsupported, ambiguous, conflicting, or drifted requests.
- Repeatable local demo path.

## 3. Explicit exclusions

- Multi-user accounts, roles, permissions, and real-time collaboration.
- Autonomous repository mutation or unreviewed merges.
- Full IDE, GitHub, and pull-request automation.
- Long-running agents with unrestricted shell or workspace access.
- Production sandboxing and isolated code execution.
- Enterprise audit retention, billing, and multi-tenant hosting.
- Automated architecture correctness proofs.
- General project management or issue tracking.
- Marketplace of templates, plugins, or model providers.
- Immutable revisions and separate append-only evidence storage in the current MVP.

## 4. Current implementation

The TypeScript monorepo implements the local MVP and Stage 6 authority migration:

~~~text
Brief
  → analysis provider/model selection
  → constraint extraction
  → registry-backed discovery
  → high-confidence auto-advance or confirmed generator
  → authorized proposal
  → human approval
  → prompt artifact
  → PRD context summary and document workspace
  → creation provider/model selection
  → per-document execution and reroll
  → verification/export
~~~

Supported generator IDs:

- swift-spritekit for mobile physics;
- python-flet for desktop UI;
- react-typescript for web dashboards.

The registry controls capability expansion. Enrichment and models cannot introduce executable stacks.

## 5. Acceptance criteria

### Intent and routing

- A user can submit a natural-language brief.
- Platform, language, framework, version, and prohibition constraints are extracted.
- Discovery returns only registry-backed actionable options.
- Unsupported discoveries remain visible and non-actionable.
- Final proposals require a registered generator ID; discovery may auto-advance a high-confidence registered result, while every review-required path still needs explicit confirmation.
- Unsupported, ambiguous, conflicting, low-confidence, or incompatible intent returns review-required.
- No unsupported brief is silently routed to a legacy web template.

### Authorization and synthesis

- Registry policy validates generator, lifecycle, version, template, capability, constraint, registry-version, and policy-hash conditions.
- The orchestrator creates the authorized synthesis context.
- Normal provider input excludes raw enrichment and analyzer reasoning.
- Successful synthesis produces a valid Architecture Packet V2.
- Packet components, references, generator version, and provenance are validated before approval.
- Mock and Ollama use a provider-neutral generation boundary; OpenRouter embeddings remain a separate capability boundary.

### Review and evidence

- A human can review a proposal before saving it.
- A saved blueprint can produce a deterministic prompt artifact.
- A prompt can create a pending execution.
- Executions transition through pending, running, completed, or failed.
- Provider metadata and generated output are recorded.
- Human verification notes are visible.
- The full trace can be reviewed and exported.

### Reliability and safety

- Shared Zod schemas validate API and persisted boundaries.
- Secrets are excluded from prompts, logs, artifacts, fixtures, and docs.
- Normal application flow cannot authorize an unregistered stack.
- Failure paths are covered by focused tests.
- Verification results and environment blockers are recorded.

## 6. Delivery history

1. Foundation: local TypeScript stack, modular monolith, SQLite, shared contracts, provider abstraction, and evidence model.
2. Blueprint workflow: authoring, persistence, prompt compilation, and review UI.
3. Provider boundary: execution lifecycle, mock provider, Ollama adapter, normalized output, and verification.
4. Local AI demo: catalog refresh, independent model roles, packet export, and command-center UI.
5. Registry routing: three registered domains, strict classification, dynamic packets, and no fallback.
6. Constraint gate: exact matching, hard constraints, prohibitions, unsupported review, and questions.
7. Stage 6 authority migration: discovery/authorization separation, policy hashes, provenance, provider isolation, and enrichment adapters.
8. API evidence: deterministic action coverage and complete workflow trace.
9. Vault Prompt and documentation consolidation.

Detailed history is in [BUILD_LOG.md](../BUILD_LOG.md).

## 7. Priority order

1. Preserve registry routing and authority boundaries.
2. Preserve brief-to-verification traceability.
3. Preserve human confirmation and scope control.
4. Keep contracts and persistence deterministic.
5. Keep providers replaceable and bounded.
6. Keep the local demo reliable and understandable.
7. Add integrations only after the core evidence path remains clear.

## 8. Current hardening backlog

### H1 — Native persistence verification

The historical full-suite report passed in its original environment. If the current runtime reports a better-sqlite3 Node ABI mismatch, rebuild the native dependency before claiming current persistence verification.

### H2 — Provider context enforcement

The normal API path passes AuthorizedSynthesisContext, but compatibility parameters still accept a plain synthesis context. Tighten the provider contract so unvalidated synthesis cannot be called directly.

### H3 — Durable approval and revisions

The blueprint record is mutable and approval is mainly the UI save action. A future revision/approval model requires an ADR, migration, and compatibility strategy.

### H4 — Complete execution provenance

Execution records link to packet and blueprint context but do not independently store the full authorization provenance. Add this only with a defined schema and migration.

### H5 — Future execution policy

Before direct code-writing or Codex workspace access, define allowed context, file scope, sandbox, timeouts, secrets, destructive operations, approvals, and mandatory checks.

## 9. Testing strategy

### Runtime companion connection

- A static Vercel client must show a connection screen without issuing API requests when unpaired.
- Companion integration coverage must verify loopback binding, pairing-token expiry, exact origin enforcement, bearer protection of streams and disk sync, and offline recovery.
- Custom endpoints must pass the versioned connection-info probe before activation.
- The default unpaired view is an ephemeral browser workspace. It must retain provider credentials and generated content only in memory, avoid all Vault API and persistence calls, and clearly direct users to Saved API / Companion mode for durable work.
- Local Ollama onboarding must explain exact-origin CORS configuration and Chromium Local Network Access. OpenRouter supports OAuth PKCE with a temporary session-storage verifier and an explicit existing-key fallback that is held only in memory; catalog failure may fall back to a user-entered model ID.
- Ephemeral generation must carry the architecture into selected document generation and Markdown/ZIP export without creating a blueprint, execution record, or disk-sync request.

- Unit tests for extraction, classification, policy validation, packet rules, prompt generation, and state transitions.
- Contract tests for provider normalization, catalog filtering, schema validation, and unavailable models.
- Integration tests for SQLite persistence, approval flow, execution records, and verification.
- API coverage for discovery, review-required behavior, proposal authorization, prompt generation, execution, and verification.
- Regression fixtures for SwiftUI versus Swift/SpriteKit, unsupported Vue, conflicting mobile/web intent, prohibitions, stale policy, and version drift.
- Golden fixtures for deterministic prompt and packet structure.

## 10. Verification

Run:

~~~powershell
npm test
npm run typecheck
npm run build
npm run seed:demo
git diff --check
~~~

Focused authority checks:

~~~powershell
npm test -- --run tests/authority-boundary.test.ts tests/generator-registry.test.ts tests/architecture-orchestrator.test.ts tests/architecture-analyzer.test.ts tests/constraint-extractor.test.ts
~~~

Current record:

- typecheck passes in the current workspace;
- build passes in the current workspace;
- focused rendering, API-client, provider, and export checks pass with 19 tests;
- the live API mutation flow has been verified for tag persistence and blueprint deletion;
- release `v1.0.0` is tagged and merged into local `main`;
- the full suite currently reports 96 passing tests; the local API is verified on port 3001 with `GET /api/providers/status`.

## 11. Release rule

A feature is complete when behavior, tests, documentation, acceptance criteria, and verification evidence agree.

An architectural change requires human approval, an updated ADR, an updated architecture record, updated tests/migration notes, and a build-log entry.
