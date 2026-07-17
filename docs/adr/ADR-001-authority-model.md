# ADR-001 — Authority-Boundary Migration

## Status

Accepted and implemented for Stage 6.

## Decision

Separate discovery from authorization. Enrichment is an untrusted observation layer; `GeneratorRegistry` is the sole policy authority; `ArchitectureOrchestrator` is the sole synthesis authorization path. Providers receive only a passed `AuthorizedSynthesisContext`.

## Rationale

The prior registry routing protected the supported stack set but allowed classification, handoff metadata, and provider context to be implicitly authoritative. Explicit policy hashes, version/template checks, constraint validation, and provenance make drift and unauthorized substitution visible.

## Consequences

- Supported IDs remain `swift-spritekit`, `python-flet`, and `react-typescript`.
- Unknown, unsupported, deprecated, disabled, conflicting, or drifted requests terminate at `review-required`.
- Discovery remains ephemeral and can surface unsupported technologies without making them actionable.
- Successful packets carry the exact authorization path.
- The manual structured blueprint endpoint remains unchanged as a trusted-input exception.

## Rejected alternatives

No inferred fallback generator, provider-side selection, React/Tailwind substitution, or enrichment override is permitted.
