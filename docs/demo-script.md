# The Vault Architect — Product Story and Demo Script

**Status:** Canonical product story and local demonstration
**Last reviewed:** 2026-07-21

This document consolidates the former demo story and demo script. The architecture is defined in [architecture.md](architecture.md). Delivery scope is defined in [development-plan.md](development-plan.md).

## 1. Product story

AI coding tools are fast, but architecture, constraints, and verification are easy to lose between a design decision and an implementation request.

Vault Architect makes that handoff visible. A human describes an outcome, the system discovers only registered directions, the user confirms the architecture, a provider proposes a structured packet, and the application preserves the prompt, output, provider metadata, and verification evidence together.

> AI recommends. The user confirms. The registry authorizes. The provider executes. The evidence remains attached to the original intent.

The demo scenario is an AI Dashboard Analytics Panel with React and TypeScript, an API boundary, responsive layout, loading/empty/error/ready states, keyboard accessibility, and bounded scope.

The demo must also show that unsupported or ambiguous intent produces Review Required rather than a silent web fallback.

## 2. Setup

~~~powershell
npm install
npm run seed:demo
npm run dev:api
npm run dev:web
~~~

Open the Vite URL, normally http://localhost:5173.

For Ollama:

~~~powershell
ollama serve
ollama pull llama3.2:3b
ollama pull dolphin3:8b
~~~

Use AI_PROVIDER=ollama for the configured Ollama path. If Ollama is unavailable, select and name the deterministic mock explicitly.

## 3. Three-minute walkthrough

### Hosted ephemeral path

For the production site, open `https://the-vault-dusky.vercel.app`. Without a saved connection it opens Ephemeral Mode. Choose Local Ollama or OpenRouter, generate an architecture, select supporting documents, and download the ZIP. Explain that this path has no Vault API, SQLite record, history, or disk synchronization; all results disappear on refresh. For OpenRouter, OAuth is preferred, while an existing key and a model ID such as `openrouter/auto` are tab-only fallbacks. Select **Saved API / Companion mode** to demonstrate the durable workflow below.

For the Windows companion demo, use the current `v1.0.4` pre-release asset, `Vault Companion Setup 1.0.4.exe`; do not use the superseded `1.0.0`–`1.0.3` installers. On first launch, confirm the empty local Vault setup screen, then create a saved blueprint and verify it survives reopening the companion. The current installer is an unsigned pre-release despite this smoke-tested workflow.

### 0:00–0:25 — Establish the problem

Show the `THE VAULT ARCHITECT` masthead, local workspace/model metadata, status ribbon, and provider signal.

Say:

> AI coding tools are fast, but architectural intent is easy to lose between a design decision and an implementation request. Vault Architect preserves that intent as a reviewable handoff.

### 0:25–1:05 — Turn the brief into discovery

Select Start with a brief. Enter the dashboard panel brief. Refresh the catalog if needed and choose the analysis provider/model.

Explain that constraint extraction comes first, discovery is consultative, and the registry exposes the React/TypeScript direction for this web-dashboard brief.

### 1:05–1:35 — Confirm and review

For a high-confidence registered result, point out that the proposal begins synthesizing automatically. If discovery requires review, select the registered direction and choose Confirm & synthesize.

Review the boundary, selected generator, dynamic packet components, constraints, files, assumptions, acceptance criteria, and provider metadata.

Say:

> The model can organize intent, but it cannot approve its own architecture. The human review step is the boundary.

Choose Approve & save blueprint.

### 1:35–2:05 — Compile the prompt

Select Compile prompt. Show the README-style context summary beneath the project name, then expand the parser-ready payload.

Point out the path, architecture overview, dependencies, constraints, acceptance criteria, and verification instructions.

Say:

> The system makes the context explicit before AI execution is allowed. The prompt is an inspectable artifact, not hidden conversation state.

### 2:05–2:35 — Select and generate documents

Review the PRD preview, choose ARCHITECTURE.md, API.md, DATA_MODELS.md, COMPONENTS.md, DEVELOPMENT_PLAN.md, TESTING_STRATEGY.md, DEPLOYMENT.md, and TROUBLESHOOTING.md, then select Generate Core Documentation.

The dedicated workspace opens with PRD.md, README.md, and the selected documents. Show the sidebar statuses, fading persona thought cycle, live SSE Markdown preview, and batch/individual export controls. The cursor and status text make progress visible without a blocking spinner or polling loop.

Select one document and use Reroll This Document. Point out that the reroll is linked to the same immutable PRD and does not alter neighboring files.

Return to the dashboard briefly to show canonical tag filters, the card action menu, browser-local cover customization, and confirmed deletion behavior.

### 2:35–2:55 — Execute through a replaceable provider

Show provider/model metadata and the generated document execution records.

Show provider/model, lifecycle status, duration, artifact metadata, generated output, and execution history.

Say:

> The provider is replaceable. The same execution service can run local Ollama or the deterministic mock without changing the blueprint or evidence model.

Never describe mock output as Ollama output.

### 2:55–3:00 — Verify and close

Enter:

> Reviewed the responsive states, API boundary, loading/error behavior, and accessibility constraints against the blueprint.

Select Add verification note and show it attached to the result.

Say:

> Vault Architect does not replace architectural judgment. It preserves that judgment while making it useful to AI implementation: specification, prompt, output, and verification stay connected.

## 4. Safety intervention

Use this brief:

~~~text
Build a SwiftUI iOS settings application. No web.
~~~

SwiftUI is not a registered generator. The correct result is Review Required with the unsupported framework visible. Do not substitute SpriteKit, React, or Tailwind.

For Vue or another unsupported framework, show that discovery may expose the technology while final synthesis remains blocked.

## 5. Recovery

- Seed missing: run npm run seed:demo and refresh.
- Ollama unavailable: choose Deterministic mock and label it.
- Model pulled after startup: use Refresh catalog.
- Model removed: refresh and choose an available model.
- API unavailable: start npm run dev:api on port 3001.
- Proposal rejected: read the structured reason and clarify or choose a registered direction.
- Native SQLite issue: rebuild better-sqlite3 before claiming persistence verification.
- Never conceal failure with an unregistered or silent fallback.

## 6. Evidence checklist

The audience should see:

- original brief;
- selected registered generator;
- Review Required behavior or its explanation;
- approved proposal;
- Architecture Packet V2 components;
- deterministic prompt;
- independent creation provider/model;
- generated output and artifact metadata;
- human verification note;
- optional full-trace export.
