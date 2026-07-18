# Vault Architect Documentation

**Status:** Canonical documentation index
**Release:** `v1.0.0`
**Last reviewed:** 2026-07-18

This directory contains durable product documentation, accepted decisions, submission material, and historical verification evidence. Current source code and executable tests remain the implementation authority.

## Canonical documents

| Document | Use it for |
| --- | --- |
| [architecture.md](architecture.md) | System structure, authority boundaries, providers, persistence, SSE, UI ownership, API surface, and security |
| [development-plan.md](development-plan.md) | Product scope, acceptance criteria, delivery history, hardening backlog, testing, and release readiness |
| [demo-script.md](demo-script.md) | Current product narrative, local setup, three-minute walkthrough, recovery, and evidence checklist |
| [submission-notes.md](submission-notes.md) | Current external-submission framing and judging narrative |
| [ADR-001](adr/ADR-001-authority-model.md) | Accepted authority-boundary decision and rejected alternatives |
| [BUILD_LOG.md](../BUILD_LOG.md) | Chronological implementation decisions, contributions, verification, and release history |

## Evidence

- [API coverage report](reports/discovery-actions-api-report.md)
- [Entire workflow trace](reports/entire-workflow-report.md)

These reports are historical evidence. They do not override current source code, tests, or the verification status recorded in the README and build log.

## Documentation hygiene

- Product behavior belongs in the README and canonical documents.
- Architectural changes require an ADR plus updates to `architecture.md`, `development-plan.md`, tests, and `BUILD_LOG.md`.
- Generated prompts and implementation instructions belong in application source or runtime artifacts, not standalone project documentation.
- Historical reports remain immutable evidence; new requirements must not be added to them.
