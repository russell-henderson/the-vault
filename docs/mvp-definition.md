# The Vault Architect — MVP Definition

## Problem statement

Human architectural decisions are often lost between a design conversation and an implementation task. A coding agent can produce useful code quickly, but without structured context it may miss constraints, invent requirements, or make results difficult to review. The Vault Architect creates a durable handoff between architectural thinking and Codex execution.

The MVP proves that one structured component blueprint can become a validated, Codex-ready implementation prompt, one or more provider-selected execution records, generated artifacts, a packet export, and a reviewable verification trail.

## Target user

The primary user is a technical founder, staff engineer, architect, or product-minded developer who knows what should be built but wants AI assistance translating that intent into implementation work without losing the reasoning behind it.

The MVP is optimized for one user working in one project workspace. It is not a team collaboration product yet.

## Core workflow

1. **Define:** The user creates a component blueprint containing architecture, technology requirements, dependencies, state/data requirements, UI requirements, and constraints.
2. **Validate:** The system checks required fields, normalizes metadata, assigns an identifier, and reports missing or contradictory information.
3. **Analyze:** The user selects an available analysis provider/model from the live local catalog, or the deterministic mock, to propose a structured blueprint packet.
4. **Prepare:** The system generates a Codex-ready implementation prompt with the approved blueprint, explicit scope, assumptions, acceptance criteria, and verification instructions.
5. **Create:** The user selects an independent creation provider/model. The API validates the selection against the current catalog, runs the provider, and records normalized provider/model metadata.
6. **Review:** The user compares the original specification, generated prompt, artifact, verification notes, and optional full-trace JSON export in one review view.

## MVP features

### Blueprint authoring

- Form for the required blueprint sections.
- Natural-language brief composer plus structured authoring form.
- Metadata: name, target path, language, framework, dependencies, source, timestamps, and optional implementation plan.
- Human-readable architecture packet and specification preview.

### Validation and prompt generation

- Required-field and shape validation.
- Review warnings for repaired or incomplete model-proposed structure.
- Deterministic prompt assembly from structured blueprint data.
- Prompt preview and copy/export action.

### Execution records

- One or more execution records can be created from an approved blueprint prompt.
- Status lifecycle: pending, running, completed, failed, and needs-review.
- Links to the blueprint, generated prompt, selected provider/model, AI contribution, artifact, and verification notes.

### AI contribution and artifact tracking

- Provider-neutral AI integration boundary.
- Captured model/provider metadata when available.
- Generated artifact stored as text or structured output with a clear artifact type.
- Traceability from artifact back to the exact blueprint and prompt revision.
- Independent analysis and creation model selection per operation.
- Manual catalog refresh with local-model filtering, unavailable-selection visibility, and deterministic mock fallback.

### Review and verification

- Review surfaces for specification, prompt, artifact, and verification notes.
- Human verification notes and review status.
- Basic checks such as schema validity, output completeness, and recorded test/verification results.

## Explicit non-goals

- A complete enterprise architecture repository.
- Multi-user accounts, roles, permissions, or real-time collaboration.
- Autonomous code changes or unreviewed merges.
- Full IDE integration, GitHub synchronization, or pull-request automation.
- General-purpose project management, issue tracking, or workflow automation.
- Long-running autonomous agents with unrestricted shell or repository access.
- Automated architecture correctness proofs.
- A marketplace of templates, plugins, or model providers.
- Production-scale analytics, billing, or multi-tenant hosting.
- Automatic polling or persistence of model selections.

## Demo scenario

The user needs a `FeatureFlagPanel` component for an internal product dashboard. The blueprint specifies React and TypeScript, a typed flag model, a local loading/error/success state, a dependency on the existing feature-flag API, keyboard-accessible controls, and a constraint that the component must not own server persistence.

The Vault Architect validates the blueprint, identifies the persistence boundary as an important constraint, and generates a Codex prompt that includes the intended file boundary, types, UI states, acceptance criteria, and verification steps. Codex produces an implementation artifact and reports the files and tests it would change. The user reviews the prompt and artifact against the original blueprint, adds a verification note about keyboard navigation, and accepts the result.

This scenario is intentionally small but demonstrates the full value proposition: architecture is not merely fed to AI; it is structured, constrained, linked, and reviewed after generation.
