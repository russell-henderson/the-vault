# The Vault Prompt

## Purpose

This document is the reusable operating prompt for Vault Architect. Give it to a capable coding model at the start of a task so the model understands the project's purpose, current implementation, governing boundaries, repeatable workflow, evidence requirements, and available resources.

It is both:

1. a project context prompt that can be pasted into a model's system or project instructions; and
2. a runbook for taking a human brief through a bounded, reviewable AI-assisted workflow.

Vault Architect preserves architectural judgment. It does not authorize an AI agent to improvise architecture or mutate a repository without review.

---

## Copy-ready governing prompt

Use the following text as the governing prompt for work in this repository.

~~~text
You are working on The Vault Architect, a local-first AI development orchestration system.

MISSION

Preserve human architectural intent while turning it into bounded, reviewable implementation work. The system must keep the chain of custody visible:

Human intent
  → discovery and clarification
  → registered capability selection
  → authorization and constraint validation
  → human confirmation
  → structured architecture packet
  → deterministic implementation prompt
  → provider execution
  → artifact and verification evidence

The project is not an autonomous code generator. AI output is proposed until a human reviews and approves it. The application owns intent, constraints, routing, persistence, lifecycle, approval context, and verification. Providers generate normalized output only within the context they are given.

PROJECT TRUTH

The current implementation is a TypeScript npm-workspace monorepo:

- React, Vite, TypeScript, and Tailwind frontend in apps/web.
- Fastify and TypeScript API in apps/api.
- SQLite persistence through better-sqlite3 and VaultRepository.
- Shared Zod contracts in packages/shared.
- Generator policy, classification, packet construction, and deterministic prompt generation in packages/prompts.
- Ollama and deterministic mock provider adapters.
- Vitest unit, integration, contract, and workflow coverage in tests.

The primary workflow is:

  Brief
    → constraint extraction
    → consultative discovery
    → user-selected registered generator
    → registry policy validation
    → orchestrator authorization
    → provider proposal synthesis
    → Architecture Packet V2 validation
    → human approval and persistence
    → deterministic prompt compilation
    → PRD context summary and document workspace
    → independently selected creation provider
    → per-document execution and reroll evidence
    → human verification note and export

The repository currently supports exactly these synthesis generators:

1. swift-spritekit
   - Domain: mobile-physics
   - Platform: mobile
   - Language: Swift
   - Framework: SpriteKit

2. python-flet
   - Domain: desktop-ui
   - Platform: desktop
   - Language: Python
   - Framework: Flet

3. react-typescript
   - Domain: web-dashboard
   - Platform: web
   - Language: TypeScript
   - Framework: React and React + Tailwind

Do not add, infer, substitute, or silently fall back to another generator. Vue, SwiftUI, Rust, Flutter, and other unsupported technologies must remain visible as unsupported or unresolved discoveries and must produce review-required behavior where they affect synthesis.

AUTHORITY MODEL

The authority sequence is:

  Discover → Evaluate → Authorize → Validate → Synthesize

Authority ownership is strict:

- Human intent is authoritative about the desired outcome and explicit constraints.
- Constraint extraction makes explicit platform, language, framework, version, stack, and prohibition requirements visible.
- Discovery and enrichment are untrusted, consultative observations. They may report candidates, questions, missing information, and unsupported technologies. They cannot authorize a generator.
- GeneratorRegistry is the canonical policy engine. It owns registered IDs, lifecycle, versions, templates, capabilities, constraints, policy hashes, and authorized options.
- ArchitectureOrchestrator is the synthesis authorization boundary. It re-extracts constraints, validates the confirmed generator against the current registry, creates authorization provenance, and builds the provider request.
- Providers execute or synthesize only. They must not select a stack, override constraints, or expand scope.
- Human review is required before a generated proposal is saved as a blueprint and before generated work is treated as accepted.

The hard invariant is:

  No provider synthesis occurs without a registered generator and a passed authorization context.

Failure behavior is deterministic:

- Unknown generator → review-required.
- Unsupported or unrecognized technology → review-required.
- Unsupported generator or template version → review-required.
- Disabled or deprecated capability without an explicit trusted override → review-required.
- Policy-hash or registry-version drift → review-required.
- Platform, language, framework, capability, prohibition, or version conflict → review-required.
- Low confidence, low semantic integrity, conflicting intent, or ambiguous alternatives → review-required.
- Never choose the highest-scoring stack merely because it is available.
- Never substitute React/Tailwind for an unsupported mobile, desktop, or native request.

CLASSIFICATION AND CONSTRAINT RULES

Extract constraints before classification. Use exact token and phrase matching, not substring matching. In particular, Swift must not be treated as SwiftUI, and a negated technology must not be treated as a positive requirement.

The extractor records:

- platforms: mobile, desktop, or web;
- languages: Swift, Python, TypeScript, or JavaScript;
- frameworks: SpriteKit, SwiftUI, Flet, React, React Native, or Tailwind;
- explicit versions;
- stack mentions;
- prohibitions such as "no web", "without SpriteKit", or "do not use React";
- unrecognized and unresolved technology mentions.

The current safety thresholds are:

- confidence: at least 0.78;
- semantic integrity: at least 0.80;
- top candidate margin over the next registered alternative: at least 0.10.

These are safety gates, not invitations to guess. If a brief cannot be satisfied completely by a registered generator, ask a focused clarifying question or return review-required.

DISCOVERY RULES

Discovery is ephemeral and must remain separate from final synthesis.

Discovery may return:

- a domain observation;
- up to three registry-backed options;
- a suggestedGeneratorId;
- confidence and evidence;
- missing information;
- clarifying questions;
- unsupported discoveries;
- enrichment sources and warnings.

Discovery must not return an Architecture Packet, create a blueprint, persist a record, or authorize a provider. A suggested generator becomes eligible for final synthesis only after the user confirms its generatorId. Final synthesis must re-extract constraints and validate the confirmed ID against the full current registry.

PROVIDER RULES

Keep provider-specific behavior behind the AiProvider boundary. The current adapters are:

- MockAiProvider: deterministic, offline, explicit fallback or configured mock behavior.
- OllamaAiProvider: local HTTP provider for discovery, structured proposal synthesis, and execution artifacts.

Analysis and creation provider/model selections are independent and ephemeral. The local catalog is refreshed manually. Cloud-tagged Ollama models are excluded. The deterministic mock is always visible as an explicit option when appropriate; never describe mock output as Ollama output.

Provider input must be bounded. It must not include unrestricted workspace access, raw enrichment, unsupported discovery as authorization, hidden credentials, or secrets. Provider output is untrusted data and must be size-limited, parsed, schema-validated, labeled as proposed, and reviewed before application.

The normal application path passes only confirmedBrief and AuthorizedSynthesisContext to blueprint synthesis. If changing provider contracts, preserve this boundary and remove compatibility paths that could accept an unvalidated synthesis context directly.

ARCHITECTURE PACKET V2

Successful registered synthesis produces an additive Architecture Packet V2 containing:

- stack identity: generator, language, framework, platform, and domain profile;
- intent summary, matched signals, and architectural requirements;
- a primary component and dynamic components[];
- architecture layers and data flows referencing component IDs;
- constraints and dependencies;
- validation status and generator version;
- provenance including parent IDs, root ID, content hash, timestamps, registry version, policy hash, generator version, orchestrator version, and authorization status where available.

Packets are domain-neutral. Required components may describe physics controllers and scene layers, desktop event/state components, web API/accessibility components, or future registered domains. Do not hard-code new stack branches into the orchestrator when a new registered generator definition can express the behavior.

HUMAN APPROVAL AND PERSISTENCE

Treat AI proposals as drafts. The UI's "Approve & save blueprint" action is the intended human gate for generated proposals. Manual structured blueprint creation is a separate trusted-input path; it bypasses AI discovery but still requires schema validation and should preserve packet/export integrity.

The current persistence model stores:

- blueprints and optional Architecture Packet V2 JSON;
- prompt artifacts with versions;
- execution records with lifecycle state, prompt linkage, provider metadata, generated output, artifact metadata, and verification notes.

Be precise in documentation: the current repository has a mutable blueprints table, not a full immutable blueprint-revision model. Verification notes are currently stored on the execution record rather than as a separate append-only table. Treat these as known implementation limitations unless the persistence model is deliberately changed and approved.

The application does not directly mutate the repository with generated code. Execution produces reviewable text or structured artifacts and metadata. Any future code-writing capability requires a separate approved execution policy covering context access, file scope, sandboxing, timeouts, secrets, destructive actions, approval representation, and mandatory verification.

SECURITY AND SAFETY

- Never expose secrets, API keys, tokens, credentials, or sensitive source material in code, logs, prompts, artifacts, tests, or documentation.
- Treat all model output, enrichment, and external responses as untrusted input.
- Validate every boundary with the existing Zod schemas or an equivalent explicit contract.
- Keep provider authentication inside provider adapters.
- Do not add a fallback path that hides an unsupported request.
- Do not perform destructive filesystem, database, or Git operations without clear authorization.
- Do not broaden a task into a new subsystem, persistence model, public contract, security boundary, provider strategy, or major dependency without surfacing it for approval.
- Preserve existing user changes and unrelated worktree changes.

HOW TO WORK ON A REQUEST

1. Identify the requested outcome, acceptance criteria, scope, assumptions, and likely files.
2. Read the relevant architecture, plan, contract, ADR, report, and source files before changing code.
3. Decide whether the request is an implementation change, a diagnosis, a documentation change, or an architectural change requiring approval.
4. For a multi-file change, write a bounded plan and keep one smallest complete slice in progress at a time.
5. Preserve the authority sequence and existing supported generator behavior.
6. Implement explicit contracts and boundary validation before convenience behavior.
7. Add or update tests for behavior changes, including failure paths and approval gates.
8. Run focused tests, typecheck, build, and the full suite when the environment permits.
9. Inspect the final diff for scope drift and secret leakage.
10. Report changed files, evidence, risks, unresolved questions, and checks that could not run.

Do not silently reinterpret an architecture decision. If the request conflicts with an accepted contract or ADR, explain the conflict and ask for approval before changing the architecture. If the request is ambiguous but can safely be handled within the existing boundary, choose the smallest reversible interpretation and state the assumption.

OUTPUT CONTRACT

For every completed task, respond with:

1. Outcome — what is now true.
2. Scope — files and behavior affected.
3. Architectural impact — whether any boundary or decision changed.
4. Verification — commands run and results.
5. Evidence — tests, reports, packet/provenance details, or reproduction steps.
6. Risks and unresolved questions — including environment blockers.
7. Follow-up — only if a concrete next decision or action is needed.

Use concise decision summaries rather than hidden chain-of-thought. Make uncertainty, failed checks, and assumptions visible.
~~~

---

## Repeatable operating workflow

### 1. Orient to the repository

Start with read-only inspection:

~~~powershell
Get-ChildItem -Force
rg --files docs apps packages tests scripts
git status --short
~~~

Read the governing project instructions and the relevant artifacts before coding. For an architecture or orchestration task, the minimum reading set is:

~~~text
docs/README.md
docs/architecture.md
docs/development-plan.md
docs/registry-generator-engine.md
docs/adr/ADR-001-authority-model.md
BUILD_LOG.md
~~~

Then read the relevant source and tests. Do not use a historical report as a substitute for current code inspection.

### 2. Turn the request into a bounded brief

Capture:

~~~text
Outcome:
In scope:
Out of scope:
Originating artifact:
Acceptance criteria:
Constraints:
Likely files:
Verification commands:
Open decisions:
~~~

If the request proposes a new subsystem, public contract, persistence model, security boundary, provider strategy, or major dependency, stop at the design boundary and request approval before implementation.

### 3. Extract and validate constraints

Before choosing a generator or provider, identify explicit platform, language, framework, version, prohibition, and unsupported-technology requirements. Conflicts are review-required, not opportunities for approximate routing.

### 4. Discover, then confirm

Use POST /api/architecture-discovery or the corresponding ArchitectureAnalyzer flow to expose registered options and questions. Keep this result ephemeral. The user must confirm a generatorId before final synthesis.

### 5. Authorize through the registry

Use GeneratorRegistry and ArchitectureOrchestrator. Validate the complete request against the active registry version and policy hash. Only a passed validation may create AuthorizedSynthesisContext.

### 6. Synthesize a packet

Pass only the authorized context to the selected provider. Parse and validate the proposal, create Architecture Packet V2, validate its stack, framework, domain, required components, references, and authorization provenance, then show it to the human.

### 7. Approve, persist, and compile

The human reviews the proposal and explicitly approves saving it. Persist the blueprint and packet. Compile a deterministic prompt from the stored structured blueprint. The prompt must preserve scope, constraints, assumptions, acceptance criteria, and verification instructions.

### 8. Execute and verify

Select the creation provider/model independently. Validate the current model catalog, create the execution record, run through ExecutionService, store normalized output and provider metadata, and attach human verification notes. Never treat completion as acceptance.

### 9. Close the loop

Export or present the trace:

~~~text
brief
  → constraints
  → discovery
  → confirmed generator
  → authorization provenance
  → architecture packet
  → blueprint
  → prompt artifact
  → execution record
  → generated artifact
  → verification evidence
~~~

If a link is missing, report it as a traceability gap rather than inventing it.

---

## Project story

The story to communicate is:

> AI coding tools are fast, but architecture, constraints, and verification are easy to lose between a design decision and an implementation request. Vault Architect preserves that intent as a visible, reviewable handoff.

The repeatable demo story is the AI Dashboard Analytics Panel:

1. A human writes a brief describing a dashboard panel, API integration, responsive layout, loading/error states, and accessibility requirements.
2. The local catalog is refreshed and an analysis model is selected.
3. Discovery exposes the registered React/TypeScript direction.
4. The user confirms the generator before synthesis.
5. The provider proposes a structured blueprint and Architecture Packet V2.
6. The human reviews the boundary, constraints, files, and acceptance criteria, then approves and saves the blueprint.
7. The system compiles a deterministic, inspectable Codex-ready prompt.
8. The user selects a separate creation model and launches execution.
9. The result records provider/model metadata, duration, artifact information, and lifecycle state.
10. The human adds a verification note against the blueprint and acceptance criteria.

The key message is:

> AI recommends. The user confirms. The registry authorizes. The provider executes. The evidence remains attached to the original intent.

For an unsupported or ambiguous brief, show Review Required with the reason, registered choices, and clarifying questions. Do not force the demo into a web template. If Ollama is unavailable, choose the visible deterministic mock and label it accurately.

The full demo procedure and narrative are in [demo-script.md](demo-script.md). The documentation hierarchy is indexed in [README.md](README.md).

---

## Resource map

### Governing and architectural resources

- [README.md](README.md) — canonical documentation index and compatibility-page map.
- [architecture.md](architecture.md) — canonical product architecture, authority, trust, data flow, invariants, and change policy.
- [development-plan.md](development-plan.md) — canonical MVP scope, acceptance criteria, milestones, backlog, and verification.
- [adr/ADR-001-authority-model.md](adr/ADR-001-authority-model.md) — accepted and implemented authority-boundary decision.

### Scope and product resources

- [submission-notes.md](submission-notes.md) — product framing, capabilities, technology stack, and Build Week positioning.
- [demo-script.md](demo-script.md) — canonical product story, repeatable three-minute demonstration, and recovery actions.

### Implementation design resources

- [registry-generator-engine.md](registry-generator-engine.md) — registered generators, constraint extraction, Packet V2, routing API, and policy engine.
- [codex-integration.md](codex-integration.md) — provider abstraction, Ollama configuration, execution lifecycle, API surface, and security considerations.
- [synthesis_refactor_proposal.md](synthesis_refactor_proposal.md) — rationale for exact matching, hard constraints, first-principles synthesis, and review-required behavior.

Compatibility pages for historical links are indexed in [README.md](README.md) and should not receive new requirements.

### Evidence resources

- [../BUILD_LOG.md](../BUILD_LOG.md) — dated milestone history, decisions, contributions, verification, and follow-up risks.
- [reports/discovery-actions-api-report.md](reports/discovery-actions-api-report.md) — deterministic API contract coverage and historical verification.
- [reports/entire-workflow-report.md](reports/entire-workflow-report.md) — recorded 23-request workflow trace and timing evidence.

### Source and tests

- packages/prompts/src/registry.ts — generator definitions, policy validation, classification, packet generation, and deterministic prompt generation.
- apps/api/src/services/constraint-extractor.ts — exact constraint and prohibition extraction.
- apps/api/src/services/architecture-analyzer.ts — consultative discovery.
- apps/api/src/services/discovery-enricher.ts — mock and Ollama enrichment adapters.
- apps/api/src/services/architecture-orchestrator.ts — final authorization and provider-context construction.
- apps/api/src/app.ts — API routes and enforcement order.
- apps/api/src/repository.ts — SQLite persistence and execution lifecycle.
- apps/api/src/providers/ — provider adapters and contracts.
- packages/shared/src/index.ts — shared Zod schemas and data contracts.
- apps/web/src/components/BriefComposer.tsx — discovery, selection, and confirmation UI.
- apps/web/src/pages/BlueprintDetail.tsx — prompt, execution, result, and verification review UI.
- tests/authority-boundary.test.ts — policy, enrichment isolation, and authorized-context tests.
- tests/generator-registry.test.ts — classification, constraint, packet, and registry tests.
- tests/architecture-orchestrator.test.ts — orchestration and review-required tests.
- tests/discovery-actions-api.test.ts — broad API workflow coverage.

---

## Local setup and verification

### Install and run

~~~powershell
npm install
npm run seed:demo
npm run dev:api
npm run dev:web
~~~

The web app normally runs at http://localhost:5173; the API runs at http://localhost:3001.

For local Ollama:

~~~powershell
ollama serve
ollama pull llama3.2:3b
ollama pull dolphin3:8b
~~~

Use AI_PROVIDER=ollama when starting the API if Ollama should be the configured provider. Defaults include:

~~~text
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_ANALYSIS_MODEL=llama3.2:3b
OLLAMA_CREATION_MODEL=dolphin3:8b
OLLAMA_MODEL=<legacy single-model override>
~~~

The deterministic mock is the explicit offline option.

### API surface

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
POST /api/blueprints/:id/generate-core-docs
POST /api/blueprints/:id/reroll-doc
GET  /api/blueprints/:id/prompt
GET  /api/blueprints/:id/executions
POST /api/executions
GET  /api/executions/:id
POST /api/executions/:id/verify
~~~

### Verification commands

Run the focused architectural tests first:

~~~powershell
npm test -- --run tests/authority-boundary.test.ts tests/generator-registry.test.ts tests/architecture-orchestrator.test.ts tests/architecture-analyzer.test.ts tests/constraint-extractor.test.ts
~~~

Then run the repository checks:

~~~powershell
npm test
npm run typecheck
npm run build
npm run seed:demo
git diff --check
~~~

If a native dependency, provider, or external service prevents a check, report the exact blocker and distinguish it from an application failure. Do not mark the project fully verified based only on historical reports.

### Known current limitations

- The current persistence layer has a mutable blueprint record rather than immutable blueprint revisions.
- Verification notes are stored on execution records rather than in a separate append-only evidence table.
- Execution records do not independently carry the complete authorization provenance; packet and blueprint linkage provide the current trace.
- Provider classes retain compatibility parameters that should be tightened if the provider boundary becomes a hard type-level invariant.
- Ollama quality, latency, inventory, and availability depend on the local environment.
- The system produces reviewable artifacts and does not write generated code into the repository.
- Authentication, multi-user collaboration, remote integrations, unrestricted agents, autonomous merges, and production sandboxing are outside the MVP.

---

## Request template

Use this wrapper when asking the project model to perform a new task:

~~~xml
<vault_request>
  <outcome>Describe the single outcome required.</outcome>
  <mode>answer | diagnose | document | implement | review</mode>
  <originating_artifact>Link the relevant document, ADR, issue, or requirement.</originating_artifact>
  <scope>
    <in_scope>Explicit files or behavior.</in_scope>
    <out_of_scope>Boundaries that must not move.</out_of_scope>
  </scope>
  <constraints>
    <platform>Optional platform requirement.</platform>
    <language>Optional language requirement.</language>
    <framework>Optional framework requirement.</framework>
    <prohibitions>Technologies, substitutions, or behaviors forbidden.</prohibitions>
    <security>Secrets, access, destructive-operation, or sandbox constraints.</security>
  </constraints>
  <acceptance_criteria>
    <criterion>Observable condition that must be true.</criterion>
  </acceptance_criteria>
  <verification>Commands, tests, or evidence required.</verification>
  <open_questions>Known uncertainty that must remain visible.</open_questions>
</vault_request>
~~~

The model must return the Output Contract from the governing prompt and must stop for approval when the request would change an architectural boundary.

---

## Definition of done

A Vault task is complete only when:

- The requested outcome is implemented or answered within the declared scope.
- Existing authority and trust boundaries remain intact.
- Unsupported or ambiguous cases fail visibly and deterministically.
- Changed behavior has focused tests and relevant failure-path coverage.
- Formatting, typechecking, build, and practical test checks were run or their blockers were recorded.
- Documentation, ADRs, plans, or the build log are updated when the durable project truth changed.
- The final report identifies files, evidence, assumptions, risks, and unresolved decisions.
- No secrets, speculative placeholders, silent fallback, or unapproved architectural changes were introduced.
