# Vault Architect Documentation

**Status:** Canonical documentation index
**Last reviewed:** 2026-07-18

Use this page to choose the correct project document. Not every Markdown file is an independent source of truth.

## Canonical documents

| Document | Use it for |
| --- | --- |
| [architecture.md](architecture.md) | System structure, authority, enrichment, trust boundaries, data flow, invariants, and change policy |
| [development-plan.md](development-plan.md) | MVP scope, acceptance criteria, milestones, backlog, testing, and release readiness |
| [demo-script.md](demo-script.md) | Product narrative, three-minute demo, setup, checkpoints, and recovery |
| [RUN.md](RUN.md) | Reusable governing prompt and operating runbook |

## Specialized references

| Document | Use it for |
| --- | --- |
| [registry-generator-engine.md](registry-generator-engine.md) | Generator definitions, registry policy, classification, constraints, packet contract, and routing |
| [codex-integration.md](codex-integration.md) | Provider abstraction, Ollama, execution lifecycle, model selection, and security |
| [ADR-001](adr/ADR-001-authority-model.md) | Accepted authority-boundary decision and rejected alternatives |
| [synthesis_refactor_proposal.md](synthesis_refactor_proposal.md) | Constraint-driven synthesis rationale and historical context |
| [submission-notes.md](submission-notes.md) | Product framing and submission material |
| [reports](reports/) | Historical API and workflow evidence |

## Compatibility pages

These paths remain so historical links continue to resolve. Their substantive content is consolidated:

- [ARCHITECTURE_CONTRACT.md](ARCHITECTURE_CONTRACT.md) → [architecture.md](architecture.md)
- [ARCHITECTURE_ENRICHMENT.md](ARCHITECTURE_ENRICHMENT.md) → [architecture.md](architecture.md)
- [architecture-diagram.md](architecture-diagram.md) → [architecture.md](architecture.md)
- [system-design.md](system-design.md) → [architecture.md](architecture.md)
- [mvp-definition.md](mvp-definition.md) → [development-plan.md](development-plan.md)
- [demo-story.md](demo-story.md) → [demo-script.md](demo-script.md)
- [agents.md](agents.md) → [architecture.md](architecture.md), [development-plan.md](development-plan.md), and [ADR-001](adr/ADR-001-authority-model.md)
- [vault.md](vault.md) → [architecture.md](architecture.md) and [development-plan.md](development-plan.md)

## Documentation rule

Current code and tests establish implementation truth. Accepted ADRs establish decisions. Canonical documents explain the current system. Reports record historical evidence. Compatibility pages preserve navigation but must not accumulate new requirements.
