# Vault Architect — End-to-End Workflow

## Stage 6 authority sequence

The brief now follows `Discover → Evaluate → Authorize → Validate → Synthesize`. Discovery suggestions are ephemeral and visibly distinguish unsupported technologies from authorized options. The registry validates the complete policy slice, and the orchestrator passes only the pinned authorized context to a provider. Any failed check is `review-required`; there is no fallback stack or React/Tailwind substitution. Manual structured blueprint creation remains a separate trusted-input path.

This document describes the workflow currently implemented in the repository: what the user does in the UI, which React component handles it, which API route is called, what validation and orchestration occur, where data is stored, and what the user sees next.

## System at a glance

```mermaid
flowchart TD
    User([User])
    App[React App<br/>App.tsx]
    Dashboard[Dashboard<br/>blueprint list]
    New[BlueprintCreate]
    Brief[BriefComposer<br/>brief + analysis selection]
    Discovery[Architecture discovery<br/>domain + registry options]
    Manual[BlueprintForm\nmanual fields]
    Proposal[BlueprintProposal\nreview packet]
    Detail[BlueprintDetail\nblueprint workspace]
    Prompt[PromptPreview]
    Launcher[ExecutionLauncher\ncreation selection]
    Result[ExecutionResult]
    Verify[VerificationPanel]
    Export[Packet export\nJSON/Markdown]

    Api[Fastify API<br/>apps/api/src/app.ts]
    Shared[Shared Zod contracts\npackages/shared]
    Analyzer[ArchitectureAnalyzer]
    Orchestrator[ArchitectureOrchestrator<br/>confirmed handoff gate]
    Registry[GeneratorRegistry]
    Generator{Registered generator}
    Provider{Selected provider}
    Ollama[Ollama provider]
    Mock[Deterministic mock]
    Repo[VaultRepository]
    SQLite[(SQLite)]
    PromptEngine[Deterministic prompt generator]
    ExecService[ExecutionService]

    User --> App
    App --> Dashboard
    App --> New
    New --> Brief
    New --> Manual
    Brief -->|POST /api/architecture-discovery| Api
    Api --> Analyzer
    Analyzer -->|discovery or review-required| Brief
    Brief -->|POST /api/blueprint-proposals + generatorId| Api
    Manual -->|POST /api/blueprints| Api
    Api --> Shared
    Api --> Orchestrator
    Orchestrator --> Extractor[ConstraintExtractor<br/>platform/language/framework/prohibition gate]
    Extractor --> Registry
    Registry --> Generator
    Orchestrator -->|Review Required on unsupported, low-confidence, or incompatible confirmed handoff| Brief
    Generator --> Provider
    Provider --> Ollama
    Provider --> Mock
    Api -->|validated proposal| Proposal
    Proposal -->|human approves| Api
    Api --> Repo
    Repo --> SQLite
    Api -->|saved blueprint| Detail
    Detail -->|POST /api/blueprints/:id/generate-prompt| Api
    Api --> PromptEngine
    PromptEngine --> Repo
    Repo --> Prompt
    Detail --> Launcher
    Launcher -->|POST /api/executions| Api
    Api --> ExecService
    ExecService --> Provider
    ExecService --> Repo
    Repo --> Result
    Detail --> Verify
    Verify -->|POST /api/executions/:id/verify| Api
    Api --> Repo
    Detail --> Export
```

## 1. Application startup

Entry point: `apps/web/src/App.tsx`

When the React application mounts, it loads three pieces of workspace state:

1. `GET /api/blueprints` loads the blueprint list.
2. `GET /api/providers/status` loads configured provider health and role defaults.
3. `GET /api/providers/models` loads the current Ollama catalog, filters cloud models, and includes the deterministic mock option.

The application stores the blueprint list, provider status, catalog, and catalog loading state at the page/application level. Catalog refresh is manual. The refresh button calls the same catalog endpoint, keeps the existing selection visible, and updates the catalog when the request succeeds.

## 2. Dashboard and navigation

Component: `apps/web/src/pages/Dashboard.tsx`

The dashboard displays:

- the blueprint count;
- packet count based on implementation plans;
- provider availability;
- the saved blueprint list;
- navigation to an existing blueprint;
- navigation to `/blueprints/new`.

The browser uses hash-based navigation. `App.tsx` selects the rendered page from the current hash path.

## 3. New blueprint workflow

Component: `apps/web/src/pages/BlueprintCreate.tsx`

The new-blueprint page has two paths:

```mermaid
flowchart LR
    Start[BlueprintCreate] --> Choice{Authoring mode}
    Choice -->|Brief mode| Composer[BriefComposer]
    Choice -->|Structured mode| Form[BlueprintForm]
    Composer --> Proposal[Review proposal]
    Proposal --> Approve[Approve and save]
    Form --> Save[Save structured blueprint]
    Approve --> Create[POST /api/blueprints]
    Save --> Create
```

### 3.1 Brief mode: consultative discovery

Component: `apps/web/src/components/BriefComposer.tsx`

The user enters a natural-language idea and chooses an analysis provider/model through `ProviderRoleControl`. The first request is discovery only; it cannot produce an Architecture Packet.

The UI prevents submission when:

- the brief is empty;
- the selected Ollama model is absent from the current catalog;
- the selected model is marked unavailable.

The deterministic mock is an explicit selectable option. It does not bypass registry discovery or final validation.

Request:

```http
POST /api/architecture-discovery
Content-Type: application/json
```

```json
{
  "brief": "Build an app that helps people understand their daily habits.",
  "analysis": {
    "provider": "mock",
    "model": "deterministic-local"
  }
}
```

The response contains the inferred domain, up to three registry-backed stack options, confidence, missing information, clarifying questions, extracted constraints, and classification evidence. It contains no blueprint or packet. The UI keeps this result in ephemeral state while the user refines the brief and confirms a `generatorId`.

After confirmation, the UI sends the refined brief and selected generator to `POST /api/blueprint-proposals`. The final route will not synthesize when `generatorId` is absent.

## 4. Discovery and proposal API workflow

Routes: `apps/api/src/app.ts` — `POST /api/architecture-discovery` and `POST /api/blueprint-proposals`

The server performs these steps in order:

```mermaid
sequenceDiagram
    participant UI as BriefComposer
    participant API as Fastify API
    participant Zod as Shared schemas
    participant A as ArchitectureAnalyzer
    participant O as ArchitectureOrchestrator
    participant R as GeneratorRegistry
    participant P as Ollama or Mock
    participant V as Packet validator

    UI->>API: POST /api/architecture-discovery
    API->>Zod: Validate discoveryInputSchema
    Zod-->>API: Valid brief
    API->>A: analyze(brief, analysis selection)
    A->>A: extractConstraints(brief)
    A->>R: discoverySlice(brief, constraints)
    R-->>A: Compact registry options + evidence
    A->>P: generateDiscovery(brief, compact registry slice)
    P-->>A: Structured recommendations only
    A-->>UI: discovery or review-required; no packet

    UI->>API: POST /api/blueprint-proposals + refined brief + generatorId
    API->>Zod: Validate confirmed handoff
    API->>O: prepareConfirmed(brief, generatorId)
    O->>O: re-extractConstraints(refined brief)
    O->>R: resolve(generatorId) against full registry
    R-->>O: GeneratorDefinition or review-required
    R->>R: Filter incompatible and unrecognized technology constraints
    O->>O: Validate hard constraints, confidence, domain, platform, and stack

    alt Unsupported or unsafe classification
        O-->>API: review-required
        API-->>UI: HTTP 422 + constraints + reasons + questions
    else Compatible registered generator
        API->>API: Validate selected provider/model
        API->>P: generateBlueprint(brief, validated synthesis context)
        P-->>API: Blueprint proposal
        API->>O: createPacket(generator, blueprint, evidence)
        O-->>API: Architecture Packet V2
        API->>V: validatePacket(packet)
        V-->>API: Validation report
        API-->>UI: HTTP 201 proposal + packet + provenance
    end
```

### 4.1 Classification and registry routing

The registry is the sole routing authority. The current registered definitions are:

| Registry id | Domain | Platform | Required architecture components |
| --- | --- | --- | --- |
| `swift-spritekit` | `mobile-physics` | Mobile | `PhysicsController`, `SceneLayer`, `EntityNode`, `InputController`, `PersistenceManager` |
| `python-flet` | `desktop-ui` | Desktop | `ViewLayer`, `EventController`, `StateModel`, `ServiceAdapter`, `PersistenceManager` |
| `react-typescript` | `web-dashboard` | Web | `ViewLayer`, `StateController`, `ApiAdapter`, `AccessibilityLayer`, `PersistenceManager` |

The Analyzer ranks a compact compatible registry slice using exact token/phrase signals and conflict rules. The Orchestrator then resolves the user-confirmed generator against the full registry. The current final safety rules are:

- confidence must be at least `0.78`;
- semantic integrity must be at least `0.80`;
- the winning generator must beat the next alternative by at least `0.10`;
- the recommended stack must exist in the registry;
- classification stack, domain, and platform must match the selected generator.

Discovery may return low-confidence options and questions. Final synthesis may not proceed on low confidence or ambiguous semantic integrity. An Analyzer recommendation is never authoritative until the user confirms a generator id.

Broad language terms and framework terms are matched as separate tokens. For example, `SwiftUI` does not match the `Swift` token, and it is an explicit conflict for the registered SpriteKit generator. There is no implicit React/Tailwind fallback.

### 4.2 Review Required path

When discovery has no registry-backed path, or final validation is unsupported, too uncertain, or incompatible, the API returns HTTP `422`:

```json
{
  "status": "review-required",
  "classification": {},
  "constraints": {},
  "reasons": ["Classification confidence is below the safety threshold."],
  "availableGenerators": []
}
```

The UI displays the reasons and available registered generators, keeps the brief editable, and does not call the provider or save a blueprint.

### 4.3 Provider generation path

Only after the user confirms a generator and the Orchestrator re-validates the refined brief does the API validate the analysis selection against the current Ollama catalog. It then passes the validated brief, first-principles synthesis instruction, generator id, and domain constraint context to the selected provider. The registry contributes constraints and required components; it does not inject a complete stack template. Providers reject blueprint synthesis when the generator id and synthesis context are absent or inconsistent. Discovery providers receive only a compact registry slice and cannot generate packets.

- `OllamaAiProvider` sends the bounded brief and generator-specific instruction to Ollama.
- `MockAiProvider` returns deterministic stack-specific proposal data for the registered generator.
- Both providers return the normalized proposal contract.

The API then creates Architecture Packet V2 and validates its language, framework, stack, domain, platform, required components, and layer references before returning the proposal.

## 5. Proposal review and approval

Component: `apps/web/src/components/BlueprintProposal.tsx`

The proposal review surface displays:

- blueprint name and description;
- selected provider metadata;
- classified domain and stack;
- confidence and classifier version;
- dynamic packet components;
- architecture boundary and core behavior;
- target path, language, and framework;
- constraints;
- implementation plan;
- files to touch;
- acceptance criteria;
- warnings and assumptions.

Nothing is saved when the proposal is merely generated. The user must select **Approve & save blueprint**.

Approval flow:

```mermaid
flowchart LR
    Review[BlueprintProposal] --> Approve[User approves]
    Approve --> Client[App.createBlueprint]
    Client --> API[POST /api/blueprints]
    API --> Parse[blueprintInputSchema]
    Parse --> Repository[VaultRepository.createBlueprint]
    Repository --> DB[(SQLite blueprints table)]
    DB --> Detail[Navigate to /blueprints/:id]
```

The blueprint is stored with the existing Phase 1/2 fields plus `architecture_packet_json`, source metadata, and source brief.

## 6. Manual structured blueprint path

Component: `apps/web/src/components/BlueprintForm.tsx`

The manual form bypasses AI proposal generation but does not bypass API schema validation. It sends the blueprint fields directly to `POST /api/blueprints`.

This path is intentionally compatible with legacy and human-authored React records. It does not automatically invent a classification or generator packet. Domain-aware packet generation applies to the brief proposal route.

## 7. Blueprint detail loading

Component: `apps/web/src/pages/BlueprintDetail.tsx`

When the detail page opens, it requests:

1. `GET /api/blueprints/:id`
2. `GET /api/blueprints/:id/executions`
3. `GET /api/blueprints/:id/prompt` when a prompt exists
4. `GET /api/executions/:id` for the newest execution when one exists

The page renders the source blueprint, Architecture Packet V2, prompt artifact, execution launcher, execution result, verification panel, and execution timeline.

## 8. Prompt compilation

Component: `BlueprintDetail` → `api.generatePrompt(id)`

Request:

```http
POST /api/blueprints/:id/generate-prompt
```

Server steps:

1. Load the approved blueprint from SQLite.
2. Generate a deterministic Codex prompt from the blueprint fields.
3. Create a versioned prompt artifact in `prompt_artifacts`.
4. Create a pending execution record linked to the blueprint and prompt artifact.
5. Return both records to the UI.

The prompt compiler is deterministic and does not call Ollama.

## 9. Execution workflow

Component: `apps/web/src/components/ExecutionLauncher.tsx`

The user chooses a creation provider/model independently from the analysis selection. The UI blocks launch when the selected Ollama model is unavailable.

Request:

```http
POST /api/executions
Content-Type: application/json
```

```json
{
  "promptArtifactId": "prompt-id",
  "creation": {
    "provider": "mock",
    "model": "deterministic-local"
  }
}
```

Server steps:

```mermaid
sequenceDiagram
    participant UI as ExecutionLauncher
    participant API as Fastify API
    participant R as VaultRepository
    participant S as ExecutionService
    participant P as Selected provider
    participant DB as SQLite

    UI->>API: POST promptArtifactId + creation selection
    API->>R: Load prompt artifact
    API->>API: Validate current provider catalog
    API->>S: execute(promptArtifact)
    S->>R: Create pending execution
    S->>R: Mark execution running
    S->>P: generate(compiled prompt, execution id)
    P-->>S: output + artifact metadata + provider metadata
    S->>R: Mark completed or failed
    R->>DB: Persist execution record
    API-->>UI: ExecutionDetails
```

Execution records retain:

- blueprint id;
- prompt artifact id;
- input prompt;
- generated output;
- provider name and model;
- fallback indicator and provider message;
- duration;
- artifact type and location;
- lifecycle status and timestamps;
- verification notes.

## 10. Human verification

Component: `apps/web/src/components/VerificationPanel.tsx`

After execution, the user enters verification notes. The UI sends:

```http
POST /api/executions/:id/verify
Content-Type: application/json
```

```json
{
  "verificationNotes": "Reviewed the generated artifact against the approved packet."
}
```

The API validates the note and updates `verification_notes` on the execution record. The detail page refreshes the execution result and timeline state.

## 11. Export workflow

Component: `apps/web/src/pages/BlueprintDetail.tsx` → `apps/web/src/lib/packet-export.ts`

The **Export Packet** action does not call the API. It assembles the currently loaded blueprint, prompt, execution history, selected execution, provider metadata, and verification evidence into the Phase 1 packet export format and downloads it locally.

The Phase 4 Architecture Packet remains embedded in the blueprint portion of that export. Existing export behavior is preserved.

## 12. Persistence map

```mermaid
erDiagram
    BLUEPRINTS ||--o{ PROMPT_ARTIFACTS : "has versions"
    BLUEPRINTS ||--o{ EXECUTION_RECORDS : "has runs"
    PROMPT_ARTIFACTS ||--o{ EXECUTION_RECORDS : "is executed by"

    BLUEPRINTS {
        text id PK
        text name
        text target_path
        text language
        text framework
        text implementation_plan_json
        text architecture_packet_json
        text source
        text source_brief
        text created_at
        text updated_at
    }

    PROMPT_ARTIFACTS {
        text id PK
        text blueprint_id FK
        text generated_prompt
        integer version
        text created_at
    }

    EXECUTION_RECORDS {
        text id PK
        text blueprint_id FK
        text prompt_artifact_id FK
        text status
        text input_prompt
        text generated_output
        text provider_name
        text provider_model
        text verification_notes
        text created_at
        text started_at
        text completed_at
    }
```

## 13. Failure and recovery behavior

| Failure | Where detected | UI behavior | Persistence behavior |
| --- | --- | --- | --- |
| API unavailable at startup | Web API client | Workspace error | No write |
| Catalog refresh fails | `App.refreshCatalog` | Existing catalog/selection remains | No write |
| Selected model unavailable | UI and API catalog validation | Disable action or show recoverable error | No generation |
| Brief unsupported or ambiguous | `GeneratorRegistry` | Show `Review Required` | No provider call or blueprint save |
| Classification/generator mismatch | `ArchitectureOrchestrator` | Show review-required response | No provider call or blueprint save |
| Provider returns invalid proposal | Provider adapter/schema boundary | Show proposal-generation error | No approved blueprint save |
| Packet structure fails validation | Generator packet validator | Show validation failure | No approved blueprint save |
| Prompt compilation fails | Prompt route | Show retryable compile error | Existing records remain unchanged |
| Execution provider fails | `ExecutionService` | Show failed execution evidence | Failed execution is retained |
| Verification save fails | Verification route | Show retryable verification error | Existing execution remains |

## 14. Current logic boundaries to inspect when debugging

Use this order when tracing a problem:

1. `apps/web/src/App.tsx` — route and workspace initialization.
2. `apps/web/src/components/BriefComposer.tsx` — discovery submission, stack confirmation, analysis selection, and Review Required rendering.
3. `apps/web/src/lib/api.ts` — request payloads and API error details.
4. `apps/api/src/app.ts` — discovery/final route parsing, provider validation, orchestration, packet creation, and response status.
5. `apps/api/src/services/architecture-analyzer.ts` — ephemeral discovery, compact registry slice, and recommendation validation.
6. `apps/api/src/services/architecture-orchestrator.ts` — confirmed-handoff validation gate.
7. `packages/prompts/src/registry.ts` — registered generators, signal scoring, discovery slices, packet construction, and validation.
7. `apps/api/src/providers/ollama-provider.ts` and `mock-provider.ts` — provider-specific normalization.
8. `apps/api/src/repository.ts` — SQLite writes, migrations, and record mapping.
9. `apps/api/src/services/execution-service.ts` — execution lifecycle transitions.
10. `apps/web/src/pages/BlueprintDetail.tsx` — prompt, execution, verification, and export state updates.

## 15. Verification commands

```text
npm test
npm run typecheck
npm run build
npm run seed:demo
```

This document describes the current implementation. If behavior changes, update `INFO.md`, the relevant architecture document, and `BUILD_LOG.md` in the same workstream.
