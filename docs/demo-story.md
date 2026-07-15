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
