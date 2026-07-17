# The Vault Architect — Build Log

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

## Log format for future entries

For each meaningful milestone, record the date, model used, repository state, major decisions, implemented features, human decisions, AI contributions, verification results, and any follow-up risks or approvals required.
