# The Vault Architect — Architecture

## Project vision

The Vault Architect is an AI-native development orchestration system that turns human architectural intent into implementation-ready work for Codex. It keeps blueprints, specifications, design decisions, implementation plans, and verification evidence connected so that AI-assisted delivery remains understandable, reviewable, and faithful to the intended architecture.

The Build Week MVP should demonstrate one compelling loop: a human defines a component and its constraints, the system produces a structured implementation workflow, Codex executes the approved work, and the resulting changes are checked against the original intent.

## Core problem

Architectural knowledge is often scattered across conversations, issue trackers, documents, and code. AI coding agents can implement quickly but may lose context, violate boundaries, or produce changes that are difficult to audit. The Vault Architect provides a durable, structured source of truth between architectural reasoning and code execution.

## Current repository state

The workspace contains a TypeScript monorepo with React/Vite/Tailwind frontend, Fastify API, SQLite persistence, shared Zod schemas, deterministic prompt generation, Ollama/local-provider adapters, and focused tests. The architecture below describes the implemented local-first workflow and its bounded future expansion.

## System architecture

The implemented MVP is a small web application with a local server-side workspace:

1. **Workspace and document layer** — stores project briefs, component blueprints, implementation packets, prompt artifacts, execution records, and verification records in SQLite, with Markdown/JSON export for review.
2. **Domain model** — represents architectural artifacts and their relationships: project, component, requirement, decision, task, implementation run, and evidence.
3. **Orchestration engine** — converts approved artifacts into a bounded implementation workflow with ordered tasks, constraints, acceptance criteria, and required checks.
4. **Provider adapter** — presents bounded workflow context to Ollama, the deterministic mock, or a future Codex provider, and normalizes results without exposing provider-specific APIs to the domain model. A read-only catalog endpoint exposes the current local Ollama inventory, hides cloud-tagged models, and keeps analysis and creation selections independent and ephemeral.
5. **Verification layer** — runs or records tests, linting, structural checks, and human review against acceptance criteria.
6. **User interface** — shows architecture, generated plans, approval gates, execution status, diffs, and verification evidence.

The current implementation uses SQLite for durable workspace records and exports the full trace as JSON. Multi-user permissions, remote integrations, and repository mutation remain outside the MVP.

## Major components

### Architectural artifacts

Artifacts are the durable units of intent. Each should have an identifier, type, title, status, owner, source, relationships, and revision history. A component blueprint should capture purpose, inputs and outputs, dependencies, invariants, acceptance criteria, and known tradeoffs.

### Plan generator

The plan generator reads selected artifacts and produces an implementation plan that is specific enough for Codex to execute. It must preserve constraints and expose uncertainty instead of silently inventing requirements.

### Approval gate

Human approval is required before a generated plan can authorize code changes, especially when the plan changes boundaries, data models, security behavior, or public interfaces.

### Execution and evidence

Each implementation run records the context supplied to Codex, tasks attempted, files changed, test results, unresolved questions, and links back to the originating architectural artifacts.

## Data flow

```text
Human intent
    ↓
Blueprints, specifications, and decisions
    ↓
Structured domain model and linked context
    ↓
Provider catalog → selected analysis model → proposal with constraints and acceptance criteria
    ↓
Human review / approval gate
    ↓
Deterministic prompt generation
    ↓
Selected creation model → provider execution through an isolated adapter
    ↓
Diffs, tests, and verification evidence
    ↓
Updated artifacts, implementation record, and audit trail
```

The system should maintain traceability in both directions: every implementation task points to its architectural source, and every decision can show the implementation work and evidence it influenced.

## Human-to-AI workflow

1. The human describes the desired component or change and records constraints and success criteria.
2. The system normalizes the input into linked architectural artifacts and flags missing information.
3. The system proposes an implementation workflow, including files or modules likely to change, sequencing, risks, and verification steps.
4. The human edits or approves the plan. Approval is the explicit authorization to proceed.
5. Codex executes the bounded plan, asking for clarification when constraints conflict or scope expands.
6. The system captures the diff and verification results, then presents them for human review.
7. The human accepts, requests revisions, or records a decision that changes the architecture.

## Architectural principles

- Human intent is authoritative; AI-generated content is proposed until approved.
- Plans are structured data first and prose second.
- Every change should be traceable to a requirement, decision, or explicit task.
- Uncertainty and conflicts must be visible.
- Provider-specific AI integration must remain replaceable.
- The MVP should optimize for a strong end-to-end demonstration, not broad platform coverage.

## Future expansion possibilities

- GitHub issues, pull requests, and review-thread synchronization.
- Multiple Codex/GPT providers and model-specific execution policies.
- Semantic search across architectural history and code.
- Automated architecture drift detection.
- Team roles, permissions, and approval policies.
- Rich dependency graphs and impact analysis.
- Reusable blueprint and workflow templates.
- Metrics for plan quality, rework, verification coverage, and decision latency.
- Remote workspaces, encrypted secrets, and enterprise audit controls.
