# Phase 4 — Registry Generator Engine

## Purpose

Phase 4 replaces template-rigid proposal generation with domain-aware routing. The orchestrator identifies the brief’s domain first, extracts hard constraints, asks the registry for a compatible generator, validates the classification evidence, and only then builds provider instructions. The registry is the sole dispatch authority.

## Registered generators

| Registry id | Domain | Platform | Packet emphasis |
| --- | --- | --- | --- |
| `swift-spritekit` | `mobile-physics` | mobile | `PhysicsController`, `SceneLayer`, `EntityNode`, `InputController`, `PersistenceManager` |
| `python-flet` | `desktop-ui` | desktop | `ViewLayer`, `EventController`, `StateModel`, `ServiceAdapter`, `PersistenceManager` |
| `react-typescript` | `web-dashboard` | web | `ViewLayer`, `StateController`, `ApiAdapter`, `AccessibilityLayer`, `PersistenceManager` |

Adding a generator means registering a new `GeneratorDefinition`; the orchestrator does not require a stack-specific branch. Each definition supplies its id, domain, platform, weighted signal rules, conflict rules, synthesis constraints, required components, packet builder, classification validator, and packet validator.

## Stage 6 consultative routing contract

```text
brief
  → extractConstraints(brief)
  → registry.discoverySlice(brief, constraints)
  → ArchitectureAnalyzer
  → compact registry-backed recommendations + questions
  → user refinement and explicit generatorId confirmation
  → re-extractConstraints(refined brief)
  → registry.get(confirmed generatorId) against the full registry
  → filter generators against hard constraints
  → confidence threshold + semantic-integrity check
  → validateConstraints(extracted constraints)
  → validateClassification(evidence)
  → provider prompt with generator constraints/instruction
  → dynamic Architecture Packet
  → validatePacket(packet)
  → human review and persistence
```

The current safety thresholds are `0.78` confidence and `0.80` semantic integrity; the top result must also exceed the next registered alternative by `0.10`. A missing registry match, low confidence, low semantic integrity, explicit conflict, close alternatives, or evidence/domain/platform mismatch produces `Review Required`. Exact token/phrase matching means `SwiftUI` is not silently interpreted as SpriteKit. The legacy React blueprint schema remains accepted for manually authored records, but it is not a routing fallback.

Discovery is not final classification. `ArchitectureAnalyzer` returns only a compact, JSON-serializable registry slice, up to three ranked options, confidence, missing information, and clarifying questions. It never creates an `ArchitecturePacket`. A recommendation becomes eligible for synthesis only after the user confirms its `generatorId`.

## Constraint Extraction Gate

`apps/api/src/services/constraint-extractor.ts` tokenizes the brief and extracts normalized `platforms`, `languages`, `frameworks`, `stackMentions`, and `prohibitions`. Negated phrases such as `no web`, `without SpriteKit`, and `do not use React` are recorded as prohibitions rather than positive requirements. Exact phrase matching prevents `SwiftUI` from matching the `Swift` language token. Explicit technology-like mentions that are not in the registered vocabulary are retained as `unrecognizedMentions`.

The registry applies the extracted constraints before ranking. A generator must satisfy every explicitly requested platform, language, and framework, and it is rejected if it matches a prohibition. Unrecognized technology mentions also force review; they are never treated as permission to select the closest registered web generator. If no registered generator satisfies the complete constraint set, the API returns HTTP `422` with `status: "review-required"`, reasons, extracted constraints, and clarifying questions.

## Architecture Packet V2

`ArchitecturePacket` is additive and versioned with `packetVersion: "2"`. It contains:

- stack identity: language, framework, platform, and domain profile;
- intent evidence: summary, matched signals, and architectural requirements;
- a primary component and a dynamic `components[]` collection;
- architecture layers and data flows that reference component ids;
- constraints and dependencies;
- generator validation and a provenance record with parent ids, root id, content hash, and timestamps.

The component collection is intentionally not web-only. Physics controllers, scene layers, persistence managers, desktop event controllers, web API adapters, and future domain-specific components use the same dynamic contract.

## API behavior

`POST /api/architecture-discovery` extracts constraints, asks the registry for a compact compatible slice, and returns discovery or `review-required`. Its result contains no packet. `POST /api/blueprint-proposals` requires the refined brief and confirmed `generatorId`, then re-extracts constraints and validates against the full registry before provider selection and generation. A successful response includes `classification`, `architecturePacket`, `packet`, `validation`, and confirmed-handoff provenance. The provider receives a first-principles synthesis instruction plus a validated domain constraint context, not a complete blueprint template. A rejected request returns HTTP `422` with `status: "review-required"`, reasons, extracted constraints, clarifying questions, classification evidence, and registered capabilities. The UI keeps discovery ephemeral and does not save a record until the final proposal is approved.

Provider/model selection remains independent from architecture routing. Both the deterministic mock and Ollama require a matching generator id and synthesis context before blueprint generation. They cannot bypass classification or cause an unsupported brief to use a legacy template.

## Compatibility and integrity

Existing Phase 1/2 fields, exports, provider metadata, prompt artifacts, execution records, and human verification remain intact. SQLite stores the packet as an additive JSON column. Packet validation occurs before proposal persistence, and the content hash/provenance chain makes the selected generator and its evidence visible in exports.

## Verification

## Stage 6 authority policy

The registry is now a policy engine, not only a classifier. Each definition exposes a `GeneratorPolicy` containing implementation platform/language/frameworks, capabilities and a capability fingerprint, supported generator versions, template lifecycle, required/conflicting constraints, lifecycle status, metadata, and a deterministic policy hash. `validateRequest` rejects unknown, unsupported, disabled, deprecated-without-override, version-incompatible, template-incompatible, capability-incompatible, constraint-conflicting, registry-drifted, and policy-hash-drifted requests. `getAuthorizedOptions` returns only the current supported registry slice.

Discovery is untrusted enrichment. It returns `suggestedGeneratorId`, visible unsupported discoveries, explicit constraints, and enrichment provenance; it never creates a packet or selects an executable generator. The Orchestrator re-extracts constraints, validates the confirmed ID through the registry, creates the authorization provenance, and passes only the authorized context to a provider. Any failed check returns `review-required` before provider access or persistence. Successful packet provenance pins the registry version, policy hash, generator version, template, request ID, and orchestrator version. The manual structured blueprint endpoint remains a separate trusted-input path.

Registry and orchestrator tests cover all three classifications, hard constraint filtering, unsupported frameworks, prohibitions, conflicting intent, duplicate registration, required dynamic components, evidence mismatch, and packet validation. API tests cover packet persistence and structured no-save `Review Required` responses. Run:

```text
npm test
npm run typecheck
npm run build
npm run seed:demo
```
