# Vault Architect — 3-Minute Demo Script

## Before the demo

Run once:

```bash
npm install
npm run seed:demo
```

For the Ollama path, also run `ollama serve`, `ollama pull llama3.2:3b`, and `ollama pull dolphin3:8b`, then start the API with `AI_PROVIDER=ollama`. Explain that the smaller model analyzes the brief and the larger local model creates the execution artifact.

Then start the API and web app in separate terminals:

```bash
npm run dev:api
npm run dev:web
```

Open the Vite URL, usually `http://localhost:5173`.

## 0:00–0:25 — The problem

Say:

> AI coding tools are fast, but architectural intent is easy to lose between a design decision and an implementation request. Vault Architect preserves that intent as a reviewable handoff.

Show the dashboard headline: **Architecture, with a visible chain of custody.** Point out the local provider signal.

## 0:25–1:05 — The brief becomes a proposal

Select **Start with a brief**. Submit the seeded analytics-panel brief and explain that the local model proposes React + TypeScript + Tailwind, API dependencies, responsive layout, loading/error states, and accessibility constraints.

If Ollama is unavailable, choose **Deterministic mock fallback** and explicitly call out the provider badge.

## 1:05–1:35 — Human approval

Review the proposal card: architecture boundary, constraints, files-to-touch, and acceptance criteria. Select **Approve & save blueprint**.

Say:

> The model can organize intent, but it cannot approve its own architecture. The human review step is the boundary.

## 1:35–2:05 — The compiled prompt

Select **Compile prompt**. Show the packet and generated prompt, pointing out that it carries the component path, architecture overview, dependencies, and constraints into a deterministic Codex-ready brief.

Say:

> The system makes the context explicit before any AI execution is allowed. The prompt is an inspectable artifact, not hidden conversation state.

## 2:05–2:35 — The execution boundary

Select **Launch execution**. Show the provider/model, duration, artifact type, artifact location, and execution history.

Say:

> The provider is replaceable. The same execution service can run a local Ollama model or the deterministic mock without changing the blueprint or evidence model.

## 2:35–2:55 — Human verification

In **Verification notes**, enter:

> Reviewed the responsive states, API boundary, loading/error behavior, and accessibility constraints against the blueprint.

Select **Add verification note**. Show the note attached to the execution result.

## 2:55–3:00 — Why it matters

Say:

> Vault Architect does not replace architectural judgment. It preserves that judgment while making it useful to AI implementation: specification, prompt, output, and verification stay connected.

## Demo recovery

- If the seeded packet is missing, run `npm run seed:demo` and refresh the dashboard.
- If Ollama is unavailable, choose the visible deterministic mock fallback.
- If the API is unavailable, start `npm run dev:api` on port 3001.
- Do not describe the mock result as an Ollama response.
