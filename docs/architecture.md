# The Vault Architect — Canonical Architecture

**Status:** Canonical architecture record
**Last reviewed:** 2026-07-18

This document is the single technical source of truth for the current application. It covers the system structure, authority contract, enrichment boundary, provider strategy, registry policy, execution lifecycle, SSE workspace, browser-local cover art, and API boundary. The accepted authority decision remains in [ADR-001](adr/ADR-001-authority-model.md).

## 1. Purpose and boundary

Vault Architect connects human architectural intent to bounded, reviewable AI-assisted implementation workflows.

The product preserves this chain of custody:

~~~text
Human intent
  → discovery and clarification
  → registered capability selection
  → authorization and constraint validation
  → human confirmation
  → architecture packet
  → deterministic implementation prompt
  → provider execution
  → artifact and verification evidence
~~~

The product is not an autonomous coding agent. Human intent, explicit constraints, approval, and verification remain authoritative. AI-generated discovery, plans, packets, prompts, and artifacts are proposed content until reviewed.

The MVP is for one user in one local workspace. Team permissions, unrestricted agents, autonomous merges, and production-scale hosting are outside the current boundary.

## 2. Source-of-truth hierarchy

When artifacts disagree, use this order:

1. Current source code and executable tests.
2. Accepted decisions in docs/adr.
3. This canonical architecture record.
4. Detailed technical contracts.
5. Development, demo, submission, and historical report documents.

Historical reports record what passed in their recorded environment. They do not override current code or current verification.

## 3. Implemented system

| Area | Implementation |
| --- | --- |
| Web | React, Vite, TypeScript, Tailwind |
| API | Fastify and TypeScript |
| Contracts | Shared Zod schemas in packages/shared |
| Policy and prompts | packages/prompts |
| Persistence | SQLite through better-sqlite3 and VaultRepository |
| Providers | Local Ollama, deterministic mock, and server-side OpenRouter embedding adapter |
| Verification | Vitest unit, integration, contract, and workflow tests |
| Runtime | Local modular monolith with a replaceable provider boundary |

The application owns the brief, constraints, routing, authorization, persistence, prompt compilation, execution lifecycle, verification, and export. Providers own only bounded normalized AI output.

## 4. End-to-end architecture

~~~text
Human
  │ natural-language brief
  ▼
React workspace
  │ catalog refresh and analysis selection
  ▼
Fastify API + shared Zod schemas
  │ constraint extraction and registry-backed discovery
  ├── High-confidence registered result: proposal synthesis
  ├── Review Required: unsupported, ambiguous, conflicting, or incomplete
  │ confirmed registered generator
  ▼
ArchitectureOrchestrator
  │ registry policy validation and authorization provenance
  ├── Review Required: no synthesis or persistence
  │ AuthorizedSynthesisContext
  ▼
Ollama or explicit deterministic mock provider
  │ structured proposal
  ▼
Architecture Packet V2 validation
  ▼
Human review and approval
  ▼
SQLite blueprint record
  │ deterministic prompt compilation
  ▼
Prompt artifact
  │ independent creation provider/model selection
  ▼
ExecutionService
  │ pending → running → completed or failed
  ▼
Execution evidence
  │ human verification
  ▼
Reviewable history and optional full-trace export
~~~

### Frontend

- Dashboard: workspace overview, provider signal, metrics, and blueprint library.
- Dashboard cards support optional browser-local cover art stored in IndexedDB; cover blobs are presentation state and never cross the API or SQLite boundary.
- BriefComposer: brief entry, discovery, model selection, generator confirmation, and synthesis.
- BlueprintProposal: proposal review and approval.
- BlueprintForm: trusted structured authoring.
- BlueprintDetail: specification, packet, prompt, execution, artifact, and verification review.
- ProviderRoleControl and ProviderModelSelect: independent role selections, refresh, and unavailable-model state.
- PromptPreview, ExecutionLauncher, ExecutionResult, ExecutionTimeline, and VerificationPanel: visible evidence layers.

### Backend

- Fastify routes for discovery, proposals, blueprints, prompts, executions, and verification.
- ConstraintExtractor for explicit platform, language, framework, version, and prohibition extraction.
- ArchitectureAnalyzer and DiscoveryEnricher for consultative discovery.
- GeneratorRegistry for policy, compatibility, classification, and packet rules.
- ArchitectureOrchestrator for final authorization and provider-context construction.
- ExecutionService for provider validation and lifecycle transitions.
- VaultRepository for SQLite persistence.
- AiProvider, OllamaAiProvider, and MockAiProvider for normalized generation behavior; OpenRouterEmbeddingProvider is isolated to embedding evaluation.

## 5. Authority and trust model

The required sequence is:

~~~text
Discover → Evaluate → Authorize → Validate → Synthesize
~~~

| Concern | Owner | Authority |
| --- | --- | --- |
| Desired outcome | Human | Authoritative |
| Explicit constraints | Brief and constraint extractor | Authoritative after extraction |
| Enrichment | Discovery adapters | Observational only |
| Candidate ranking | Analyzer and registry slice | Consultative only |
| Generator policy | GeneratorRegistry | Canonical |
| Final authorization | ArchitectureOrchestrator | Sole synthesis gate |
| AI synthesis | Selected provider | Generation only |
| Approval | Human review action | Required for generated blueprint persistence |
| Verification | Human and recorded checks | Acceptance evidence |

### Enrichment boundary

Enrichment may report observations, likely options, missing information, questions, unsupported technologies, sources, and warnings. It is temporary and untrusted.

Enrichment cannot create a packet, persist a blueprint, authorize a generator, override constraints, alter registry policy, or authorize provider access.

The Analyzer exposes enrichment as suggestedGeneratorId, likelyStackOptions, and visible unsupported discoveries. Final synthesis re-extracts constraints and validates the confirmed generator against the full registry.

### Registry boundary

GeneratorRegistry owns registered IDs, implementation platform/language/frameworks, versions, templates, lifecycle, capabilities, constraints, capability fingerprints, policy metadata, policy hashes, and authorized options. Policy metadata may declare secondary domain capabilities that inherit a generator's primary technical requirements; final authorization validates those primary requirements and every explicit brief constraint.

It rejects unknown, unsupported, disabled, deprecated-without-override, version-drifted, policy-hash-drifted, capability-incompatible, and constraint-conflicting requests.

### Orchestrator boundary

ArchitectureOrchestrator:

1. re-extracts constraints;
2. resolves the confirmed generator;
3. classifies the brief;
4. checks confidence, semantic integrity, alternative margin, conflicts, and hard constraints;
5. calls GeneratorRegistry.validateRequest;
6. creates authorization provenance;
7. builds AuthorizedSynthesisContext;
8. passes only the authorized request to final synthesis.

No provider call, packet creation, or proposal persistence may occur after failed authorization.

## 6. Registered generators

| ID | Domain | Platform | Language | Framework | Packet emphasis |
| --- | --- | --- | --- | --- | --- |
| swift-spritekit | mobile-physics | mobile | Swift | SpriteKit | physics, scene, entity, input, persistence |
| python-flet | desktop-ui | desktop | Python | Flet | view, events, state, service, persistence |
| react-typescript | web-dashboard | web | TypeScript | React / React + Tailwind | view, state, API, accessibility, persistence |

Adding a generator is a policy change. It requires a registered definition, explicit capabilities and constraints, classification and packet rules, tests, documentation, and approval. The orchestrator must not gain a stack-specific branch merely to support it.

## 7. Classification and safety

Constraint extraction occurs before ranking. Matching is token- and phrase-based, not substring-based. Negations are prohibitions. Unknown technology mentions remain unresolved and force review when they affect routing.

Safety thresholds:

- confidence at least 0.78;
- semantic integrity at least 0.80;
- top result at least 0.10 above the next registered alternative.

Return review-required for unsupported or unrecognized technology, unsatisfied constraints, conflicting requirements, prohibited stacks, low confidence, low integrity, close alternatives, evidence mismatch, unknown generators, or stale authorization metadata.

There is no default generator for an unrecognized brief.

## 8. Architecture Packet V2

A successful registered proposal carries an additive, versioned packet containing:

- stack identity;
- intent summary and evidence;
- primary component;
- dynamic components;
- architecture layers;
- data flows referencing component IDs;
- constraints and dependencies;
- generator validation;
- provenance with parent IDs, root ID, content hash, timestamps, and authorization metadata.

Validation checks schema shape, selected stack, language, framework, domain, required components, layer references, generator version, and authorization policy hash.

The packet is domain-neutral and can represent mobile physics, desktop UI, web API/accessibility, or future registered domains.

## 9. Provider boundary

Current adapters are:

- MockAiProvider: deterministic, offline, explicit fallback or configured mock.
- OllamaAiProvider: local HTTP discovery, structured proposal, and execution provider.
- OpenRouterEmbeddingProvider: server-side multimodal embedding probe using the explicitly selected `nvidia/llama-nemotron-embed-vl-1b-v2:free` model. It is not a text-generation provider and cannot be selected for blueprint or document generation.

Analysis and creation selections are independent and ephemeral. The Ollama catalog is manually refreshed, and cloud-tagged models returned by Ollama are included and labeled as cloud options. Local Ollama access uses the local service; direct hosted access uses `OLLAMA_BASE_URL` plus the server-side `OLLAMA_API_KEY`. The mock is explicit and must never be described as Ollama.

Provider inputs are bounded and must not contain unrestricted workspace access, secrets, raw enrichment, or unsupported discoveries as authorization. Provider output is untrusted and must be parsed, schema-validated, size-limited, and reviewed.

The normal API path passes confirmedBrief and AuthorizedSynthesisContext for final blueprint synthesis. Provider compatibility paths that accept a plain synthesis context remain a hardening gap.

Provider configuration is environment-based. `AI_PROVIDER=ollama` selects the configured provider and `OLLAMA_BASE_URL` defaults to `http://localhost:11434`; `OLLAMA_API_KEY` is sent only when configured, enabling direct access to `https://ollama.com` from a hosted API. No analysis or creation model is silently selected. The deterministic mock remains available as an explicit catalog option for offline development. The UI requires an explicit analysis and creation model choice, while the API retains legacy configured/mock request compatibility. `OPENROUTER_API_KEY` enables the separate embedding evaluation route; the key stays on the API server and is never sent to the browser.

Execution follows one bounded lifecycle: create a pending record, validate the provider, mark it running, generate or stream output, persist completed or failed evidence, and allow human verification. The streaming workspace closes each `EventSource` on completion, error, or unmount and commits only completed document buffers to the local workspace state.

## 10. Persistence and ownership

~~~text
Blueprint
  └── PromptArtifact
        └── ExecutionRecord
              ├── inputPrompt
              ├── generatedOutput
              ├── artifact metadata
              ├── lifecycle timestamps
              └── verificationNotes
~~~

SQLite stores blueprints, optional packet JSON, prompt artifacts, execution records, provider metadata, generated output, and verification notes.

Current truth:

- blueprints are mutable records, not immutable revisions;
- prompt artifacts are versioned per blueprint;
- verification notes are stored on executions, not in a separate append-only table;
- executions do not independently carry complete authorization provenance;
- packet and blueprint linkage provide the current trace;
- generated code is not written into the repository.

Changing these is a persistence and architecture change requiring a decision and migration plan.

## 11. API boundary

~~~text
GET  /api/providers/status
GET  /api/providers/models
POST /api/architecture-discovery
POST /api/blueprint-proposals
POST /api/blueprints
GET  /api/blueprints
GET  /api/blueprints/:id
POST /api/blueprints/:id/generate-prompt
GET  /api/blueprints/:id/workspace
GET  /api/blueprints/:id/generate/stream?filename=<CORE_DOCUMENT>&provider=<PROVIDER>&model=<MODEL>
POST /api/blueprints/:id/generate-core-docs
POST /api/blueprints/:id/reroll-doc
GET  /api/blueprints/:id/prompt
GET  /api/blueprints/:id/executions
POST /api/executions
GET  /api/executions/:id
POST /api/executions/:id/verify
~~~

The streaming endpoint returns Server-Sent Events. Each content frame is `data: {"chunk":"..."}`; successful completion emits `data: {"status":"DONE"}`, and provider or transport failures emit an error status. The workspace opens one explicitly closed stream per requested core document and persists only completed output.

Discovery review is a handled consultative state. Final proposal review is HTTP 422 with structured reasons and questions. Malformed requests return 400. Missing resources return 404. Unsupported requests do not create provider output or persisted blueprints.

POST /api/blueprints is a separate trusted-input path. It bypasses AI discovery but not schema validation or persistence integrity.

The document workspace treats the completed PRD execution as immutable source context. Core-document generation supports ARCHITECTURE.md, API.md, DATA_MODELS.md, COMPONENTS.md, DEVELOPMENT_PLAN.md, TESTING_STRATEGY.md, DEPLOYMENT.md, and TROUBLESHOOTING.md; it creates one prompt and execution record per requested filename. Rerolling one filename creates a new record linked to the same PRD and leaves other document records unchanged. Generated documents remain reviewable artifacts and are exported client-side; the server does not write them into the repository.

Blueprint cover art is a client-only enhancement. The web app validates and resizes PNG, JPEG, and WebP uploads before storing them in browser IndexedDB under the blueprint ID. Removing a blueprint also removes its local cover reference; no cover data is persisted in SQLite or sent to a provider.

## 12. Security and change policy

- Never place secrets, credentials, or sensitive source material in code, prompts, artifacts, logs, tests, or docs.
- Treat enrichment, model output, and external responses as untrusted.
- Keep authentication inside provider adapters.
- Do not let providers redefine intent or silently expand scope.
- Do not introduce direct repository mutation without explicit sandbox and approval policy.
- Preserve unrelated worktree changes.
- Prefer deterministic parsing, validation, planning, and state transitions.

Ask for approval before changing public contracts, persistence, provider strategy, generator policy, security boundaries, direct repository mutation, major dependencies, or approval semantics.

When an approved architectural change is made, update the ADR, this architecture record, tests, development plan, and BUILD_LOG.md in the same workstream.

## 13. Invariants and known gaps

Implemented invariants:

1. Unknown or unsupported generators enter review-required.
2. Enrichment cannot create authorization data.
3. Final synthesis requires a confirmed registered generator.
4. Failed registry validation blocks final provider synthesis in the application path.
5. Unsupported or ambiguous briefs receive no default generator.
6. Successful packets are validated against the selected generator.
7. Provider/model selections are checked against the current catalog.
8. Generated output remains proposed until human review.
9. The provider boundary is replaceable.
10. The application does not write generated code into the repository.

Known gaps:

1. Provider compatibility parameters can accept an unvalidated plain synthesis context outside the normal orchestrator path.
2. Blueprint revisions are mutable.
3. Verification notes are not separate append-only evidence records.
4. Execution records do not independently carry full authorization provenance.
5. Approval is primarily represented by the UI save action rather than a durable approval-state model.

## 14. Related documents

- [development-plan.md](development-plan.md): MVP scope, acceptance, roadmap, backlog, and verification.
- [ADR-001](adr/ADR-001-authority-model.md): accepted authority-boundary decision.
- [demo-script.md](demo-script.md): repeatable product story and demonstration.
- [submission-notes.md](submission-notes.md): current product framing for external submission.
- [reports](reports/): historical API and workflow evidence.
