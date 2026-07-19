# The Vault Architect — Build Log

## 2026-07-18 — Restore production Tailwind styling pipeline

- **Origin and diagnosis:** Investigated the Vercel/local styling regression after the web workspace was moved to Tailwind 4 packages while retaining the existing Tailwind 3 directives and configuration. The production bundle contained authored component CSS but omitted utility classes used throughout the React UI.
- **Correction:** Restored Tailwind 3, PostCSS, and Autoprefixer ownership to the workspace root; removed the incompatible web-local Tailwind 4 packages; and restored the classic `tailwindcss` PostCSS plugin. The authored `styles.css` visual rules were preserved.
- **Verification:** `npm run build` passed and the generated stylesheet contains the expected utility rules and authored rules. `npm run typecheck` and `git diff --check` passed. The full suite reached 79 tests with 58 passing; 21 database-backed tests remain blocked by the existing `better-sqlite3` Node ABI 127/147 mismatch.

## 2026-07-18 — Restore local API runtime

- **Diagnosis:** The API workspace resolved `better-sqlite3` 11.x while the active Node runtime required ABI 147; the API could not construct its SQLite repository and exited before listening.
- **Correction:** Aligned `apps/api` with the repository's `better-sqlite3` 12.x dependency and rebuilt the native module for the active Node runtime.
- **Verification:** API is listening on port 3001; `GET /api/providers/status` returns the healthy deterministic mock provider; all 79 tests pass.

## 2026-07-18 — Remove phi4-mini generation fallback

- **Diagnosis:** Core-document generation could retain a stale `phi4-mini:3.8b` selection from the workspace URL, while the API extrapolation path could also select a phi4 fallback when `llama3.2:3b` was unavailable.
- **Correction:** Removed phi4-mini from the Ollama catalog/UI allowlist, normalized stale workspace selections to `mock:deterministic-local`, rejected stale API selections, and removed the API's hard-coded phi4 fallback.
- **Verification:** The live catalog no longer exposes phi4-mini, deterministic-local remains available, `npm run build`, `npm run typecheck`, and all 79 tests pass.

## 2026-07-18 — Preserve Ollama model choice for document workspace

- **Diagnosis:** Ollama-origin blueprints inherited the API's globally configured mock creation selection, so the workspace URL became `provider=mock&model=deterministic-local` even when `llama3.2:3b` was available.
- **Correction:** The document handoff now prefers the available `llama3.2` model for Ollama-origin blueprints; explicit user selections remain unchanged, and mock remains available when Ollama is unavailable or explicitly chosen.
- **Verification:** The live catalog reports `llama3.2:3b` available, while `npm run typecheck`, `npm run build`, and all 79 tests pass.

## 2026-07-18 — Authorize browser SSE document streams

- **Diagnosis:** Fastify CORS covered normal responses, but the hijacked raw SSE response bypassed the plugin hook and omitted `Access-Control-Allow-Origin`.
- **Correction:** The streaming response now reflects the request origin and sends `Vary: Origin` alongside the SSE headers.
- **Verification:** The exact document stream from `http://localhost:5173` to `http://localhost:3001` returns HTTP 200, `text/event-stream`, `Access-Control-Allow-Origin: http://localhost:5173`, and a terminal `DONE` event. The focused API workflow test and typecheck pass.

## 2026-07-18 — Phase 7 SSE streaming and premium vault dashboard

- **Origin and decision:** Implemented the approved real-time document generation and Dashboard overhaul while preserving the existing provider, persistence, and human-review boundaries.
- **Features implemented:** Added the core-document SSE endpoint, Ollama NDJSON streaming, deterministic mock chunking, streaming execution persistence, EventSource workspace rendering with live Markdown/cursor states, sequential document streams, extracted `BlueprintCard`, premium hero/metrics styling, canonical tags, global mutation synchronization, and confirmed concurrent bulk deletion.
- **Reliability correction:** Blueprint delete and tag mutations already reached the API/repository but could reappear after navigation because Dashboard-local state was not synchronized with App-level blueprint state. Successful server mutations now update the authoritative client list, and repository/API tests cover canonical tags and cascading deletion.
- **Verification:** Production build and non-database focused tests passed. Database-backed tests remain blocked by the existing `better-sqlite3` ABI mismatch: installed module ABI 127 versus the current Node runtime ABI 147.

## 2026-07-18 — v1.0.0 Vault Architect final polish

- **Origin and human decisions:** Finalized the Vault Architect persona and local-first presentation for release. The release version is `1.0.0`; cover art is intentionally browser-local rather than a server persistence feature; release handoff is a local commit, annotated tag, and merge to `main` without a remote push.
- **Features implemented:** Added the primary seven-message thought cycle and secondary encouragement cycle with explicit timer cleanup; replaced workspace generation spinners with fading persona status text; authored the `THE VAULT ARCHITECT` masthead and dynamic provider status ribbon; added IndexedDB cover storage with PNG/JPEG/WebP validation, browser resizing, URL cleanup, glassmorphism overlays, and accessible card menu actions; bumped workspace packages to `1.0.0`.
- **Architecture boundary:** Cover blobs remain outside the API, SQLite repository, provider prompts, and exports. SSE remains the sole live generation transport and completed documents remain the only persisted stream result.
- **Verification results:** Focused rendering, API-client, export, and provider tests passed with 4 files and 19 tests. `npm run typecheck`, `npm run build`, and `git diff --check` passed. The full suite reached 18 files and 79 tests: 58 passed and 21 database-backed tests failed before execution because the installed `better-sqlite3` binary uses Node ABI 127 while the active runtime requires ABI 147. Tests were not weakened.

## 2026-07-18 — Documentation consolidation and prompt artifact purge

- **Decision:** Reduce documentation to durable product, architecture, development, demo, submission, decision, evidence, and build-history records. Standalone reusable prompts, compatibility pages, duplicate technical proposals, and superseded system-design pages are no longer maintained.
- **Consolidation:** The current README now describes the v1.0.0 application, live SSE workspace, dashboard vault operations, local cover art, provider modes, API surface, verification state, and release boundary. Provider, registry, execution, and UI ownership details are consolidated in `docs/architecture.md`; scope and verification remain in `docs/development-plan.md`; the demo and submission narratives are current.
- **Removed documentation artifacts:** Deleted `docs/RUN.md`, `docs/agents.md`, compatibility pages, duplicate provider/registry references, `docs/synthesis_refactor_proposal.md`, and the superseded system-design/vault pages. Historical build-log entries and workflow reports remain as evidence.
- **Verification:** Documentation links were audited after consolidation; no current README or docs index references the removed artifacts.

## 2026-07-15 — Repository foundation

- **Codex model used:** Codex runtime; exact model identifier is not exposed in this workspace.
- **Repository state:** New, effectively empty workspace. No visible source files, manifests, configuration, tests, documentation, or Git repository metadata were found.
- **Major decisions:** Establish a stack-agnostic architecture first; recommend a minimal TypeScript full-stack implementation for approval; use human-readable versioned artifacts and an adapter boundary around Codex/provider integration.
- **Features implemented:** Created initial architecture documentation, development strategy, Codex operating instructions, and this build log. No application code was created.
- **Human decisions:** Project objective and constraints supplied in the task brief; architectural changes remain approval-gated.
- **AI contributions:** Performed repository analysis; identified the project as a new foundation; proposed the MVP architecture, development phases, testing strategy, deployment considerations, and operating rules.
- **Verification results:** `rg --files` returned no existing project files; Git status could not be obtained because the directory is not a Git repository. Requested documentation files were created in the workspace. Application tests are not yet applicable.

## 2026-07-15 — Official MVP architecture

- **Codex model used:** Codex runtime; exact model identifier is not exposed in this workspace.
- **Major decisions:** Define the MVP around one end-to-end trace from immutable component blueprint revision to generated Codex prompt, approved execution record, AI artifact, and verification review. Recommend React/TypeScript/Vite/Tailwind with a Node.js/TypeScript Fastify modular monolith, SQLite, shared Zod schemas, and a provider-neutral OpenAI adapter.
- **Features defined:** Blueprint authoring and validation, prompt generation, explicit approval, execution records, AI contribution/artifact linkage, and reviewable verification notes.
- **Human decisions:** Repository analysis phase approved; enterprise collaboration, autonomous merges, broad integrations, and unrestricted agent execution remain outside MVP scope.
- **AI contributions:** Authored MVP definition, system design, database concept, API surface, AI boundary, and three-minute demo narrative.
- **Verification results:** Planning documents were created without application code. Stack and boundaries are documented for implementation approval; no runtime tests are applicable yet.

## 2026-07-15 — Implementation milestone 1

- **Codex model used:** Codex runtime; exact model identifier is not exposed in this workspace.
- **Major decisions:** Initialized an npm workspace monorepo. Used shared Zod schemas, a typed SQLite repository backed by `better-sqlite3`, a deterministic prompt package, and a Fastify API. External AI calls remain out of scope.
- **Features implemented:** Blueprint creation/list/detail routes, validation, SQLite schema and persistence, deterministic Codex prompt generation, prompt artifact storage, pending execution record storage, React/Vite/Tailwind scaffold, and unit tests.
- **Human decisions:** Approved implementation milestone 1 and explicitly deferred authentication, deployment, external AI APIs, and full UI implementation.
- **AI contributions:** Implemented the approved vertical slice and corrected the root build script to compile workspace dependencies in order.
- **Verification results:** `npm test` passed: 3 test files and 4 tests. `npm run typecheck` passed. `npm run build` passed for shared, prompts, API, and web packages. `npm install` reported 5 audit vulnerabilities and pending native build scripts; these are follow-up dependency hygiene items, not runtime test failures.

## 2026-07-15 — Implementation milestone 2

- **Codex model used:** Codex runtime; exact model identifier is not exposed in this workspace.
- **Major decisions:** Preserved the modular monolith and added a hash-based React workflow instead of introducing a routing dependency. Added prompt lookup, execution lookup, and blueprint execution history endpoints. Kept prompt generation deterministic and external AI integration deferred.
- **Features implemented:** Dashboard with empty/list states, structured blueprint creation form with shared Zod validation, blueprint detail view, prompt generation action, prompt preview, execution timeline, API error normalization, and frontend/API workflow tests.
- **Human decisions:** Approved the Vault Interface + Blueprint Workflow milestone and continued to defer authentication, deployment, and external AI APIs.
- **AI contributions:** Implemented the approved user journey and updated the demo narrative with capture points and judging walkthrough.
- **Verification results:** `npm test` passed: 5 test files and 8 tests. `npm run typecheck` passed. `npm run build` passed for shared, prompts, API, and web packages. The workspace still has no visible Git metadata, so branch/tag state was not independently verifiable.

## 2026-07-15 — Codex integration milestone

- **Codex model used:** Codex runtime; exact model identifier is not exposed in this workspace.
- **Human architectural decisions:** Keep AI execution provider-neutral; defer all external AI requests and credentials; require execution records to preserve prompt, output, artifact metadata, timestamps, failure evidence, and human verification notes.
- **AI implementation contributions:** Added `AiProvider`, deterministic `MockAiProvider`, `ExecutionService`, lifecycle persistence, execution/verification routes, frontend execution launcher/result/evidence panels, lifecycle tests, and integration documentation.
- **Features implemented:** `POST /api/executions`, enriched `GET /api/executions/:id`, `POST /api/executions/:id/verify`, completed/failed mock execution handling, schema migration for existing SQLite records, and BlueprintDetail workflow from prompt generation to verification.
- **Verification results:** `npm test` passed: 7 test files and 12 tests. `npm run typecheck` passed. `npm run build` passed for shared, prompts, API, and web packages. No external AI requests were made.

## 2026-07-15 — Final demo readiness pass

- **Major decisions:** Kept the architecture and dependency set unchanged. Added only a repeatable local demo seed, presentation-focused copy/spacing/status polish, and documentation alignment.
- **Demo data:** Added the `AI Dashboard Analytics Panel` seed with React + TypeScript + Tailwind, API integration, responsive layout, loading/error states, and accessibility requirements.
- **Documentation:** Updated README, demo story, demo script, and implemented architecture diagram to describe the current mock-provider workflow accurately.
- **Verification results:** `npm run seed:demo` succeeded. `npm test` passed: 7 test files and 12 tests. `npm run typecheck` passed. `npm run build` passed for shared, prompts, API, and web packages.

## 2026-07-16 — Local AI demo and command-center UI

- **Major decisions:** Use the existing provider boundary for Ollama; keep the deterministic mock as an explicit user-selected fallback; make natural-language brief → validated blueprint → human approval → architecture packet the primary demo path.
- **Features implemented:** Added shared proposal/implementation-plan schemas, Ollama HTTP adapter with strict JSON validation, provider health reporting, configurable provider selection, SQLite persistence for packet/source metadata, provider metadata on executions, brief composer, proposal review surface, architecture packet rendering, stage rail, provider/fallback indicators, and command-center dashboard styling.
- **Documentation:** Updated README, Ollama setup, demo script, demo story, provider integration notes, and architecture diagram. Added `.env.example`.
- **Verification results:** `npm test` passed: 8 test files and 15 tests. `npm run typecheck` passed. `npm run build` passed for shared, prompts, API, and web packages. Ollama runtime behavior was covered with mocked HTTP contract tests; a live model run remains environment-dependent.
- **Follow-up risks:** Model quality and latency vary by local Ollama model. The first implementation stores the generated packet with the blueprint but does not write generated code into the repository.

## 2026-07-16 — Dual local model roles

- **Major decisions:** Configure `llama3.2:3b` for fast structured analysis and blueprint proposals, and `dolphin3:8b` for creation/execution artifacts. Keep both roles configurable and retain `OLLAMA_MODEL` as a compatibility override.
- **Features implemented:** Ollama requests now select the role-specific model; provider health checks verify both local models; the UI reports the analysis → creation model pair; setup and demo documentation use the exact installed model tags.
- **Verification results:** Role-specific provider behavior is covered by the Ollama contract tests. `npm test` passed: 8 test files and 15 tests. `npm run typecheck` passed. `npm run build` passed for shared, prompts, API, and web packages. The local `ollama list` command could not be executed in the restricted runner, so live Ollama availability remains environment-dependent.

## 2026-07-16 — Live Ollama workflow verification

- **Verification results:** Confirmed local Ollama inventory includes `llama3.2:3b` and `dolphin3:8b`. Live smoke test passed provider health, blueprint proposal generation with `llama3.2:3b`, blueprint persistence, prompt compilation, and completed execution with `dolphin3:8b` using an in-memory database. The small analysis model omitted some optional structure, so the adapter now inserts visible review warnings and the final proposal still passes schema validation.
- **Final checks:** `npm test` passed with 8 test files and 16 tests. `npm run typecheck`, `npm run build`, and `npm run seed:demo` passed.

## 2026-07-16 — Prompt compilation request hardening

- **Bug fixed:** The web client was sending `content-type: application/json` on the prompt-compilation POST without a body, causing Fastify to reject the request.
- **Implementation:** Prompt compilation now sends a serialized `{ blueprintId }` body. The API client only sets JSON content type when a body exists, parses non-JSON error responses safely, and normalizes network failures. Blueprint detail now shows action-specific error states and a retry action.
- **Verification results:** `npm test` passed: 9 test files and 17 tests. `npm run typecheck` and `npm run build` passed.

## 2026-07-16 — Phase 1 Markdown and packet export

- **Features implemented:** Added Markdown copy actions to prompt and execution artifacts, including Clipboard API fallback and inline success/failure feedback. Added full-trace JSON packet export with blueprint, prompt artifact, all executions, selected execution details, verification evidence, schema version, timestamp, and sanitized filename.
- **Scope:** Phase 2 provider hot-swapping, Phase 3 telemetry, Phase 4 verification-state changes, and Phase 5 glassmorphism were intentionally left unchanged.
- **Verification results:** `npm test` passed: 10 test files and 19 tests. `npm run typecheck` passed. `npm run build` passed for shared, prompts, API, and web packages.

## 2026-07-16 — Phase 2 provider catalog refresh and hot-swapping

- **Major decisions:** Keep provider choices ephemeral and per operation. Preserve legacy configured/mock request fields while adding shared analysis and creation selections. Filter `:cloud` models from the selectable catalog and retain the deterministic mock option.
- **Features implemented:** Added shared provider selection/catalog schemas, `GET /api/providers/models`, live Ollama tag listing and filtering, current-catalog server validation, role-specific proposal/execution selection, accessible model selects, refresh controls with loading/feedback states, unavailable-selection visibility, and catalog-aware provider status.
- **Documentation:** Updated README, Codex integration notes, and demo script with catalog refresh, model selection, and validation behavior.
- **Verification results:** Added catalog filtering, mock inclusion, selected metadata, unknown-model rejection, and accessible control rendering tests. `npm test` passed with 11 files and 23 tests; `npm run typecheck`, `npm run build`, and `npm run seed:demo` passed. The restricted runner could not start `ollama list`, so live Ollama smoke verification remains environment-dependent.
- **Follow-up risks:** Ollama availability and model inventory remain environment-dependent; the UI keeps the mock option usable when a catalog refresh fails.

## 2026-07-16 — Documentation alignment after Phase 2

- **Documentation:** Audited and updated README, MVP definition, development plan, architecture, system design, architecture diagram, demo story, demo script, Codex integration notes, and submission notes to describe the live Ollama catalog, independent analysis/creation selections, manual refresh behavior, cloud filtering, deterministic mock fallback, provider validation, packet export, and current API routes.
- **Verification:** Searched all Markdown documentation for stale pre-Phase-2 provider and API references; historical build-log entries remain unchanged as milestone records.

## 2026-07-16 — Phase 4 registry-based domain routing

- **Origin and decision:** Implement the approved Phase 4 refinement: intent-first classification, a `GeneratorRegistry` as the sole routing authority, three named initial stacks, strict confidence/compatibility gates, and no legacy template fallback.
- **Features implemented:** Added shared classification evidence, Architecture Packet V2, dynamic component/layer/data-flow contracts, provenance records, registry definitions for Swift/SpriteKit, Python/Flet, and React/TypeScript, `ArchitectureOrchestrator`, strict API proposal routing, packet persistence, domain-aware mock/Ollama defaults, and a visible web `Review Required` state.
- **Compatibility:** Existing manual blueprints, provider hot-swapping, normalized provider/model metadata, prompt artifacts, execution records, verification notes, and Phase 1 packet exports remain supported.
- **Verification:** Added registry and API tests for all stack routes, unsupported intent, packet validation, evidence mismatch, duplicate registration, packet persistence, and no-save review gating. `npm test` passed with 12 files and 31 tests. `npm run typecheck`, `npm run build`, and `npm run seed:demo` passed.

## 2026-07-16 — Logical synthesis engine refactor

- **Problem addressed:** Replaced substring-based registry matching and provider/template fallback behavior that could conflate broad language terms with framework intent.
- **Features implemented:** Added exact token/phrase matching, weighted signal rules, explicit conflict rules, semantic-integrity scoring, mandatory confidence/integrity gates, generator-owned synthesis contexts, first-principles provider instructions, and strict mock/Ollama synthesis-context requirements.
- **Behavioral result:** SwiftUI is no longer treated as SpriteKit. Because SwiftUI is not registered in the initial three-stack registry, ambiguous SwiftUI briefs enter `Review Required` rather than defaulting to React or SpriteKit.
- **Verification:** Added regression coverage for SwiftUI conflict handling, weighted classification, synthesis instructions, strict packet framework validation, mandatory mock context, and existing workflows. `npm run typecheck`, `npm run build`, and `npm run seed:demo` passed. `npm test` passed with 12 files and 35 tests.

## 2026-07-16 — Constraint extraction and hard routing gate

- **Problem addressed:** Explicit brief constraints could be treated as ordinary signals, allowing a ranked generator to win even when platform, language, framework, or prohibition requirements were incompatible.
- **Features implemented:** Added token/phrase-based `ConstraintExtractor`; integrated extraction before registry classification; filtered generators against all required constraints; treated explicit prohibitions as non-overridable; added strict generator constraint validation; appended hard-constraint instructions to synthesis prompts; and returned structured `Review Required` responses with extracted constraints and clarifying questions.
- **Behavioral result:** Supported Swift/SpriteKit mobile briefs route to the native generator. SwiftUI briefs remain `Review Required` because SwiftUI is not registered; they never fall back to React/Tailwind. Conflicting mobile/web requirements and prohibited React/web stacks also require review.
- **Verification:** `npm test` passed with 14 test files and 48 tests. `npm run typecheck`, `npm run build`, and `git diff --check` passed.

## Log format for future entries

## 2026-07-17 — Provider boundary and unknown-framework hardening

- **Problem addressed:** Ollama retained a direct legacy React + Tailwind normalization path when called without generator context, and unknown framework mentions such as Vue were not preserved as constraints.
- **Features implemented:** Ollama now rejects missing or mismatched generator context before making a provider request; strict normalization defaults only from the selected synthesis context and rejects model output outside that context. Constraint extraction records unrecognized technology mentions, and the registry returns `Review Required` instead of ranking those briefs into a registered web generator.
- **Compatibility:** The orchestrator flow and intentional structured manual blueprint endpoint remain unchanged.
- **Verification:** `npm test` passed with 14 test files and 53 tests. `npm run typecheck`, `npm run build`, and `git diff --check` passed.

## 2026-07-17 — Stage 6 consultative architecture workflow

- **Origin and decision:** Implemented the approved two-stage workflow from `docs/agents.md`: discovery and recommendation are separate from confirmed final synthesis. Discovery remains ephemeral; only the confirmed handoff and successful packet provenance are retained.
- **Features implemented:** Added shared discovery contracts, `ArchitectureAnalyzer`, compact registry discovery slices, `POST /api/architecture-discovery`, provider-specific discovery generation for Ollama and Mock, explicit `generatorId` final handoff validation, re-extraction of refined constraints, selected-generator provenance, and staged BriefComposer UI controls for analyze/select/confirm/synthesize.
- **Integrity behavior:** Analyzer responses cannot contain packets. Unknown generator ids from a discovery provider are rejected. Final synthesis does not call a provider without a confirmed registered generator. Existing manual structured blueprint creation, provider hot-swapping, packet validation, exports, and no-fallback behavior remain intact.
- **Regression correction:** Expanded ordinary-language ignore terms in the constraint extractor so vague discovery briefs are not incorrectly treated as unsupported technology requests.
- **Verification:** `npm test` passed with 15 test files and 60 tests. `npm run typecheck`, `npm run build`, `npm run seed:demo`, and `git diff --check` passed.

## Log format for future entries

## 2026-07-17 — Stage 6 authority-boundary migration

- **Origin and decision:** Implemented the approved authority-boundary migration and ADR-001. Enrichment is discovery-only, the GeneratorRegistry is the policy engine, and the ArchitectureOrchestrator is the sole synthesis authorization path.
- **Features implemented:** Added shared policy, validation, enrichment, authorized-context, and provenance contracts; policy hashes and lifecycle/version/template/capability/constraint validation; Mock and Ollama enrichment adapters; visible unsupported discovery; provider isolation; and final packet authorization checks.
- **Integrity behavior:** Unknown, unsupported, disabled, deprecated-without-override, conflicting, version-drifted, or hash-drifted requests stop at `review-required` before provider access, packet creation, or persistence. No fallback stack or React/Tailwind substitution was introduced. Manual structured blueprint creation remains functional.
- **Verification:** 64 tests passed; `npm run typecheck`, `npm run build`, `npm run seed:demo`, and `git diff --check` passed. Diff check emitted only existing LF/CRLF conversion warnings.

## 2026-07-17 — Discovery and actions API coverage

- **Coverage:** Added a deterministic end-to-end contract test for CORS preflight, provider status/catalog, discovery success/review/validation, proposal authorization, manual blueprint creation, prompt generation/retrieval, execution, verification, persistence, and not-found paths.
- **Correction:** Tightened cloud-model detection for Ollama names with suffix forms such as `:120b-cloud`.
- **Evidence:** See [`docs/reports/discovery-actions-api-report.md`](docs/reports/discovery-actions-api-report.md).
- **Verification:** Full suite passed with 17 test files and 67 tests; typecheck, build, seed, and diff checks passed.

## 2026-07-17 — Entire workflow timing trace

- **Trace:** Started the complete in-process workflow from CORS preflight through discovery, review, proposal authorization, manual persistence, prompt generation, execution, retrieval, and verification.
- **Evidence:** [`docs/reports/entire-workflow-report.md`](docs/reports/entire-workflow-report.md) records all 23 requests, response summaries, HTTP statuses, and per-handler durations.
- **Result:** PASS; 23 requests completed with a summed handler duration of 134.76 ms in the recorded run. The repeatable runner is [`scripts/run-entire-workflow-report.ts`](scripts/run-entire-workflow-report.ts).

## 2026-07-18 — Vault Prompt operating guide

- **Origin and decision:** Consolidated the project architecture, authority model, workflow, demo story, resources, commands, and known limitations into `docs/RUN.md` as the reusable governing prompt for future project work.
- **Documentation implemented:** Added copy-ready model instructions, repeatable brief-to-verification workflow, supported generator inventory, provider and security boundaries, resource map, API/setup references, request template, output contract, and definition of done.
- **Truthfulness safeguards:** Documented the current mutable blueprint persistence model, execution-level verification storage, incomplete artifact-level authorization provenance, provider compatibility paths, and environment-dependent Ollama behavior rather than presenting planned capabilities as implemented facts.
- **Verification:** Confirmed the document is present, structurally complete, and no application code was changed.

## 2026-07-18 — Documentation consolidation

- **Decision:** Established a formal documentation hierarchy with `docs/README.md` as the index and three canonical documents: `architecture.md`, `development-plan.md`, and `demo-script.md`.
- **Consolidation:** Merged overlapping architecture, system-design, enrichment, MVP, demo, and Stage 6 planning material into the canonical documents. Preserved historical paths as compatibility pages so existing links remain valid.
- **Truthfulness:** Reconciled documented intent with current code by explicitly recording mutable blueprint persistence, execution-level verification notes, incomplete standalone execution provenance, provider compatibility paths, and the current approval model as hardening gaps.
- **Verification:** Relative Markdown link audit found no missing targets; `git diff --check` passed with only existing LF/CRLF conversion warnings.

### Milestone 1: Multi-Document Workspace and Isolated Rerolls

* **Date:** 2026-07-18
* **Model Used:** AI Assistant (Gemini) paired with user instructions; DeepSeek/Phi4-mini targeted for local generation.
* **Repository State:** Database layer updated with additive SQLite columns to support prompt/document metadata and source execution linkage. Generated documents are treated strictly as artifacts and are not committed to the repository codebase.
* **Major Decisions:**
  * Extended the PRD workflow into a bounded multi-document workspace.
  * The completed PRD remains the immutable source context.
  * Each requested core document receives an independent prompt and execution record.
* **Implemented Features:**
  * Codex-ready context blocks and README-style compile summary.
  * Selectable core-document generation matrix.
  * Dedicated workspace route (`#/blueprints/:id/workspace`) with Markdown preview.
  * Per-document status indicators.
  * Client-side Markdown and ZIP batch export.
  * Isolated document reroll API endpoint (`POST /api/blueprints/:id/reroll-doc`).
* **Human Decisions:** Initiated the shift from a single-pane form to a comprehensive multi-document engineering workspace.
* **AI Contributions:** Designed the API contracts, structured the prompt context blocks for token efficiency, and implemented the React UI layout and routing logic for the new workspace.
* **Verification Results:** `npm run typecheck` and production build passed.
* **Follow-up Risks or Approvals Required:** Focused and full test suites are blocked by a `better-sqlite3` native module ABI mismatch. Tests must be rerun after successfully rebuilding the dependency for the current Node runtime.

---

### Milestone 2: Workspace Demo State and HITL Editing

* **Date:** 2026-07-18
* **Model Used:** AI Assistant (Gemini).
* **Repository State:** UI state management expanded to handle asynchronous batch processing. Prompt registry updated to enforce strict context embedding.
* **Major Decisions:**
  * Batch generation immediately routes the user to the workspace to view live progress via polling.
  * Human-in-the-Loop (HITL) editing implemented, preserving local edits per document across tab switches and exports.
  * Reroll prompts explicitly label the completed PRD text as `PRIMARY SYSTEM CONTEXT: PRD.md` to ensure architectural alignment.
* **Implemented Features:**
  * Immediate workspace transition with live execution polling.
  * Sidebar spinners and center-pane skeleton loaders for actively generating files.
  * Partial failure recovery with red error states and a `Retry Document` boundary.
  * Edit/Preview toggle for raw markdown manipulation.
  * Workspace breadcrumb navigation.
* **Human Decisions:** Requested a robust UX for the dashboard → prompt → execution → verification demo loop, explicitly calling out the need for loading states, failure fallbacks, and manual edit capabilities.
* **AI Contributions:** Engineered the React state management for asynchronous polling, built the fail-safe error boundaries, and integrated the editable `<textarea>` / markdown preview toggle.
* **Verification Results:** `npm run typecheck`, `npm run build`, and focused UI/prompt tests (7 tests) passed.
* **Follow-up Risks or Approvals Required:** `npm test` and `npm run seed:demo` remain completely blocked. Node 26 lacks a prebuilt binary for `better-sqlite3`, and local rebuild attempts failed due to a Windows `EPERM` file lock on the `.node` module. The zombie Node process holding the lock must be killed (`taskkill /F /IM node.exe`) before the native module can be rebuilt and the live demo can proceed.

For each meaningful milestone, record the date, model used, repository state, major decisions, implemented features, human decisions, AI contributions, verification results, and any follow-up risks or approvals required.

---

### Milestone 3: Dashboard Organization and Vault Management

* **Date:** 2026-07-18
* **Model Used:** Antigravity (Gemini).
* **Repository State:** SQLite repository updated with `tags_json` column and blueprint deletion SQL queries. Fastify API routes added for PATCH, DELETE, and bulk deletion. Client helper library and vitest suites verified.
* **Major Decisions:**
  * Implemented an interactive inline tag manager (+ Tag creation, delete pill tag, filter pill filters) on the dashboard without modal complexity.
  * Added inline title renaming and red confirmation deletion triggers on cards to minimize layout friction.
  * Integrated a checkmark overlay selection mode for bulk vault actions (Zip archive download of markdown packages and bulk deletion).
* **Implemented Features:**
  * Horizontally scrolling, multi-select tag filter bar.
  * Contextual kebab action menus on card hover.
  * Inline rename fields and confirmation states.
  * "Manage Vault" bulk checkbox mode.
  * Bottom floating action bar showing active selections.
  * Client-side zip generation of selected blueprints as individual Markdown specs.
  * API endpoints: `PATCH /api/blueprints/:id`, `DELETE /api/blueprints/:id`, and `POST /api/blueprints/bulk-delete`.
* **Human Decisions:** Requested a premium dashboard UI refresh to support organization, tagging, and bulk operations.
* **AI Contributions:** Fully implemented the Fastify router handlers, SQLite repository deletion queries, React dashboard tag filtering, bulk selection states, zip generator calls, and fixed the parsed Zod blueprint validation test suite.
* **Verification Results:** All **73 test cases passed successfully** under Node v22. `npm run typecheck` and `git diff --check` passed.

---

### Milestone 4: Bulk Actions Execution & Interactive Labeling

* **Date:** 2026-07-18
* **Model Used:** Antigravity (Gemini).
* **Repository State:** Client codebases updated to utilize `jszip` and `file-saver` for packaging. Dashboard components wired to execute API mutations concurrently.
* **Major Decisions:**
  * Enabled asynchronous multi-workspace ZIP construction (`jszip`) fetching complete project document histories in the background.
  * Added floating bulk labeling dialog input with concurrent patch executions.
  * Implemented instant UI feedback with auto-dismissing toast confirmations and optimistic local state filtering.
* **Implemented Features:**
  * Bulk Delete Execution with local React state filtering.
  * Bulk ZIP Export (`exportBulkBlueprintsAsZip`) with folder structural mapping.
  * Interactive Labeling System (+ inline tag inputs on Enter and x pill removal).
  * Bulk Labeling floating bar popover input.
* **Human Decisions:** Approved the use of `jszip` and `file-saver` to bundle entire project artifacts during bulk export.
* **AI Contributions:** Integrated JSZip packaging logic, wired the asynchronous React event handlers, implemented toast notifications, and set up type definitions.
* **Verification Results:** All **73 test cases passed successfully**. `npm run typecheck` and workspace builds verified.

---

### Milestone 5: Local File System Sync & Edit State Management

* **Date:** 2026-07-18
* **Model Used:** Antigravity (Gemini).
* **Repository State:** Fastify server updated to write directly to disk paths. Workspace UI wired to handle in-memory document state modification and tab guards.
* **Major Decisions:**
  * Implemented path traversal validation on `/api/blueprints/:id/sync-to-disk` for security.
  * Added uncommitted "dirty" indicator logic (orange dot) next to modified workspace documents.
  * Introduced tab guards intercepting sidebar switches while edits are uncommitted.
* **Implemented Features:**
  * `/api/blueprints/:id/sync-to-disk` endpoint for writing folders recursively.
  * "Sync to Local Folder ↘" header button, folder sync modal, and localStorage path retention.
  * "Save Changes" and "Discard" controls replacing export buttons on uncommitted modifications.
  * Tab Switch Guard prompting window confirm triggers.
* **Human Decisions:** Requested a premium direct-disk sync mechanism and explicit save/discard workflows.
* **AI Contributions:** Implemented file system write controllers, added localStorage hooks, built React uncommitted change state logic, and updated typescript definitions.
* **Verification Results:** All **73 test cases passed successfully**. `npm run typecheck` and `git diff --check` passed.
## 2026-07-18 — Explicit model selection and OpenRouter embedding evaluation

- **Decision:** Remove automatic analysis/creation model selection from the UI and stop using silent Ollama model fallbacks. Existing generation adapters remain unchanged when a user explicitly chooses a local model.
- **Stale-selection handling:** Removed phi4 and stale model URLs now clear the selection instead of silently switching to `mock:deterministic-local`.
- **Embedding boundary:** Added the server-side `OpenRouterEmbeddingProvider` and catalog entry for `nvidia/llama-nemotron-embed-vl-1b-v2:free`. The model is exposed as an embedding evaluation choice, not as a text-generation model, and `OPENROUTER_API_KEY` is never exposed to the browser.
- **Verification:** The provider catalog shows local generation models and the OpenRouter embedding model separately; generation routes reject embedding selections; the mocked SDK contract returns a bounded vector preview. `npm test` passes with 18 files and 80 tests; `npm run typecheck`, `npm run build`, and `git diff --check` pass. The live probe correctly returns a controlled missing-key response until `OPENROUTER_API_KEY` is configured.

## 2026-07-18 — Ollama cloud model selection for demonstrations

- **Decision:** Keep Ollama as the generation provider while allowing cloud-tagged Ollama models to appear in the catalog and be selected for analysis or creation. Preserve the OpenRouter integration as a separate embedding/other-provider boundary.
- **Implementation:** Cloud model names are now retained from Ollama discovery, labeled in the UI, accepted by generation validation, and supported with optional `OLLAMA_API_KEY` bearer authentication for direct `https://ollama.com` access from a hosted API.
- **Human Decision:** Requested support for available Ollama cloud models for one or two demonstrations without replacing the existing Ollama workflow.
- **Verification:** Focused provider/workflow tests passed (15 tests); full suite passed (18 files, 81 tests); `npm run typecheck`, `npm run build`, and `git diff --check` passed.
