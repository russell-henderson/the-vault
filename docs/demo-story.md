# The Vault Architect — Three-Minute Demo Story

## 0:00–0:35 — Starting problem

“Teams can describe a feature clearly in a design conversation, then lose the important details when the work reaches an AI coding agent. The agent may produce code, but the architecture, constraints, and reasoning are no longer visible in the result.”

Show the empty review state: no connected specification, prompt, artifact, or verification history.

## 0:35–1:15 — User action

Create a `FeatureFlagPanel` blueprint. Fill in the architecture description, React and TypeScript requirements, feature-flag API dependency, loading/error/success state, keyboard-accessible UI requirements, and the constraint that the component must not own persistence.

Click **Validate blueprint**. The Vault Architect confirms the structure, assigns a revision, and displays the important constraint and acceptance criteria. This makes the human’s architectural reasoning explicit before any AI output is requested.

## 1:15–2:05 — AI collaboration

Click **Prepare Codex prompt**. The system generates a focused implementation prompt containing the original specification, scope boundaries, expected files, acceptance criteria, and verification steps.

Approve the handoff and click **Run implementation workflow**. Explain that Codex receives the optimized context through a provider boundary, not as an unstructured chat transcript. The execution record shows the blueprint revision, prompt version, provider/model metadata, and AI contribution.

The result is a proposed implementation artifact and file manifest. The system preserves the relationship: this output came from this blueprint revision and this exact prompt.

## 2:05–2:40 — Result review

Open the review view and move across four tabs: **Specification**, **Codex prompt**, **Generated artifact**, and **Verification**. Add a human verification note: keyboard navigation is required and persistence remains outside the component boundary.

Show the status changing from generated to reviewed. The audience can see what the human asked for, what the AI was told, what it produced, and how the result was checked.

## 2:40–3:00 — Why this matters

“The Vault Architect does not replace architectural judgment. It preserves that judgment while making it useful to Codex. The result is faster implementation with a visible chain of intent, constraints, AI contribution, and verification. This small workflow can later connect to repositories, pull requests, and architecture drift checks—but the core value is already demonstrated today.”

## Milestone 2 demo sequence

1. Open the dark Vault Architect dashboard and show the blueprint library or the empty state.
2. Select **Create blueprint** and enter the `FeatureFlagPanel` specification.
3. Submit the form and show that the validated blueprint is persisted and immediately opened in detail view.
4. Walk through the stored architecture context, dependencies, and constraints.
5. Select **Generate Codex prompt** and show the deterministic prompt artifact plus the pending execution record.
6. Refresh or revisit the detail view to demonstrate that the prompt and execution history are retrieved from the API rather than held only in browser state.
7. Close on the trace from human specification to Codex-ready handoff.

## User workflow screenshots to capture later

- Dashboard empty state with the primary create action.
- Completed blueprint form showing the structured architecture fields.
- Blueprint detail view with the specification and generated prompt side by side.
- Execution history panel showing the pending handoff status.
- Optional final review state after AI integration is added.

## Expected judging walkthrough

Judges should see three things clearly: the user is defining architecture in a structured way, the generated prompt preserves that context and constraints, and the resulting execution record makes the handoff auditable. Emphasize that Milestone 2 intentionally uses deterministic prompt generation; the AI provider is a later replaceable boundary, not a hidden dependency in the workflow.
