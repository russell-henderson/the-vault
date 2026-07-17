# Vault Architect — Authority Contract

## Purpose

Stage 6 makes authority explicit and keeps AI assistance bounded. The supported generators remain `swift-spritekit`, `python-flet`, and `react-typescript`.

## Authority model

The system has three authority levels:

1. Enrichment is untrusted discovery. It can report observations, missing information, and unsupported technologies. It cannot select or authorize a generator.
2. `GeneratorRegistry` is the canonical policy engine. It owns lifecycle, versions, templates, implementation details, capabilities, constraints, and policy hashes.
3. `ArchitectureOrchestrator` is the enforcement gate. It is the only path that creates a passed authorization context for provider synthesis.

The required sequence is:

```text
Discover → Evaluate → Authorize → Validate → Synthesize
```

## Trust and provider boundaries

The flow is `User brief → explicit constraints → untrusted enrichment → registry evaluation → authorized registry slice`. Model output, heuristics, enrichment, and provider responses never create authorization data. Providers receive only `AuthorizedSynthesisContext`; raw enrichment and analyzer reasoning are excluded.

Every final request is checked for generator, lifecycle, version, template, platform, language, framework, capabilities, prohibitions, registry version, policy hash, discovery consistency, and semantic integrity. Any failure returns `review-required` before provider access, packet creation, persistence, or fallback selection.

## Provenance and exception

Successful synthesis records request ID, generator and template versions, registry version, policy hash, orchestrator version, discovery/enrichment sources, confirmation, status, and timestamp. Discovery is ephemeral. The manual structured `/api/blueprints` endpoint remains a separate trusted-input path with its existing schema validation and persistence behavior.

There is no fallback stack and no React/Tailwind substitution for an unsupported request.
