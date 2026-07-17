# Phase 4 — Registry Generator Engine

## Purpose

Phase 4 replaces template-rigid proposal generation with domain-aware routing. The orchestrator identifies the brief’s domain first, asks the registry for a compatible generator, validates the classification evidence, and only then builds provider instructions. The registry is the sole dispatch authority.

## Registered generators

| Registry id | Domain | Platform | Packet emphasis |
| --- | --- | --- | --- |
| `swift-spritekit` | `mobile-physics` | mobile | `PhysicsController`, `SceneLayer`, `EntityNode`, `InputController`, `PersistenceManager` |
| `python-flet` | `desktop-ui` | desktop | `ViewLayer`, `EventController`, `StateModel`, `ServiceAdapter`, `PersistenceManager` |
| `react-typescript` | `web-dashboard` | web | `ViewLayer`, `StateController`, `ApiAdapter`, `AccessibilityLayer`, `PersistenceManager` |

Adding a generator means registering a new `GeneratorDefinition`; the orchestrator does not require a stack-specific branch. Each definition supplies its id, domain, platform, weighted signal rules, conflict rules, synthesis constraints, required components, packet builder, classification validator, and packet validator.

## Routing contract

```text
brief
  → registry.classify(brief)
  → confidence threshold + alternative-margin check
  → registry.get(recommendedStackId)
  → validateClassification(evidence)
  → provider prompt with generator constraints/instruction
  → dynamic Architecture Packet
  → validatePacket(packet)
  → human review and persistence
```

The current safety thresholds are `0.78` confidence and `0.80` semantic integrity; the top result must also exceed the next registered alternative by `0.10`. A missing registry match, low confidence, low semantic integrity, explicit conflict, close alternatives, or evidence/domain/platform mismatch produces `Review Required`. Exact token/phrase matching means `SwiftUI` is not silently interpreted as SpriteKit. The legacy React blueprint schema remains accepted for manually authored records, but it is not a routing fallback.

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

`POST /api/blueprint-proposals` classifies and validates before provider selection and generation. A successful response includes `classification`, `architecturePacket`, and `validation`; the packet is also embedded in the blueprint sent for approval. The provider receives a first-principles synthesis instruction plus a validated domain constraint context, not a complete blueprint template. A rejected brief returns HTTP `422` with `status: "review-required"`, reasons, classification evidence, and registered capabilities. The UI keeps the brief editable and does not save a record.

Provider/model selection remains independent from architecture routing. The deterministic mock is still an explicit provider option, but it cannot bypass classification or cause an unsupported brief to use a legacy template.

## Compatibility and integrity

Existing Phase 1/2 fields, exports, provider metadata, prompt artifacts, execution records, and human verification remain intact. SQLite stores the packet as an additive JSON column. Packet validation occurs before proposal persistence, and the content hash/provenance chain makes the selected generator and its evidence visible in exports.

## Verification

Registry tests cover all three classifications, unsupported intent, duplicate registration, required dynamic components, evidence mismatch, and packet validation. API tests cover packet persistence and the no-save `Review Required` path. Run:

```text
npm test
npm run typecheck
npm run build
npm run seed:demo
```
