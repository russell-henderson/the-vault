# Vault Architect — 3-Minute Demo Script

## Before the demo

Run once:

```bash
npm install
npm run seed:demo
```

Then start the API and web app in separate terminals:

```bash
npm run dev:api
npm run dev:web
```

Open the Vite URL, usually `http://localhost:5173`.

## 0:00–0:25 — The problem

Say:

> AI coding tools are fast, but architectural intent is easy to lose between a design decision and an implementation request. Vault Architect preserves that intent as a reviewable handoff.

Show the dashboard headline: **Turn intent into implementation.**

## 0:25–0:55 — The blueprint

Select **AI Dashboard Analytics Panel** from the seeded dashboard card. Explain that the blueprint captures React + TypeScript + Tailwind, API dependencies, responsive layout, loading/error states, and accessibility constraints.

If demonstrating creation instead of the seed, select **Create blueprint**, enter the same fields, and click **Validate & save blueprint**.

## 0:55–1:30 — The compiled prompt

Select **Generate Codex prompt**. Show the generated prompt artifact and point out that it carries the component path, architecture overview, dependencies, and constraints into a deterministic Codex-ready brief.

Say:

> The system makes the context explicit before any AI execution is allowed. The prompt is an inspectable artifact, not hidden conversation state.

## 1:30–2:15 — The execution boundary

Select **Launch execution**. The current demo uses the local mock provider, so it is reliable and requires no external key. Show the completed provider result, artifact type, artifact location, and execution history.

Say:

> The provider is replaceable. Today this is a deterministic mock; the same execution service can later connect to Codex without changing the blueprint or evidence model.

## 2:15–2:45 — Human verification

In **Verification notes**, enter:

> Reviewed the responsive states, API boundary, loading/error behavior, and accessibility constraints against the blueprint.

Select **Add verification note**. Show the note attached to the execution result.

## 2:45–3:00 — Why it matters

Say:

> Vault Architect does not replace architectural judgment. It preserves that judgment while making it useful to AI implementation: specification, prompt, output, and verification stay connected.

## Demo recovery

- If the seeded card is missing, run `npm run seed:demo` and refresh the dashboard.
- If the API is unavailable, start `npm run dev:api` on port 3001.
- If an execution was already launched, launch again to create a fresh evidence record.
- Do not describe the mock result as a live OpenAI response; external AI integration is intentionally deferred.
