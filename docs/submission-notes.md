# The Vault Architect — Submission Notes

**Release:** `v1.0.0`
**Category:** Developer Tools
**Secondary category:** Work & Productivity

## Project overview

The Vault Architect is a local-first architecture orchestration workspace. It preserves human intent and constraints while making AI-assisted development reviewable from brief to blueprint, generated document, execution evidence, and verification.

The product is not an autonomous coding agent. The registry authorizes supported directions, the user approves the blueprint, providers generate bounded artifacts, and the evidence remains attached to the originating intent.

## Problem

AI coding tools can move quickly while architectural decisions drift or disappear. Teams need to know what was requested, which constraints were accepted, what the model produced, which provider/model was used, and whether a human verified the result.

## Current solution

```text
Human brief
  → discovery and constraint extraction
  → confirmed registered generator
  → Architecture Packet V2
  → human approval
  → deterministic prompt artifact
  → Ollama or deterministic mock execution
  → SSE document workspace
  → verification and export
```

The v1.0.0 experience includes:

- registry-backed discovery with explicit `Review Required` states;
- independent analysis and creation provider/model selection;
- local Ollama support plus an explicit deterministic mock;
- SQLite persistence for blueprints, packets, prompts, executions, and verification notes;
- live SSE Markdown generation with a persona-driven thought cycle;
- document rerolls, local editing, Markdown/ZIP exports, and execution evidence;
- canonical tags, rename/delete/bulk-delete operations, and browser-local IndexedDB cover art;
- a premium dashboard centered on the authored `THE VAULT ARCHITECT` identity.
- a hosted Ephemeral Mode for browser-only Ollama or OpenRouter generation, selected-document generation, and Markdown/ZIP export without persistence; OpenRouter supports OAuth plus a memory-only existing-key fallback.

## Why it matters

Vault Architect makes the handoff between architecture and implementation visible. It gives AI useful context without giving AI authority to redefine the request or silently expand scope.

## Technology

- React, TypeScript, Vite, and Tailwind CSS
- Fastify and TypeScript
- SQLite through `better-sqlite3`
- Zod shared contracts
- Ollama and deterministic provider adapters
- Vitest verification suite

## Human and AI collaboration

Human decisions control product direction, architecture boundaries, approval semantics, security constraints, and release scope. Codex contributed implementation, tests, documentation, UI refinement, provider integration, and verification work within those boundaries.

## Demonstration path

For the hosted path, demonstrate Ephemeral Mode first: provider connection, architecture generation, selected documents, and ZIP export without saving. Use the analytics dashboard panel brief with Saved API / Companion mode to demonstrate discovery, generator confirmation, packet review, approval, prompt compilation, live document streaming, verification, and persistent vault operations.

The three-minute walkthrough is maintained in [demo-script.md](demo-script.md). The current implementation and boundaries are maintained in [architecture.md](architecture.md) and [development-plan.md](development-plan.md).

## Known verification note

Static checks, production builds, focused tests, and live API mutation checks pass. The full suite has an environment-specific `better-sqlite3` native ABI mismatch in the current runtime; the exact result is recorded in [BUILD_LOG.md](../BUILD_LOG.md) and the root README.
