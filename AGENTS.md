# Codex Operating Instructions — The Vault Architect

## Project purpose

The Vault Architect connects human-defined architectural intent to bounded, reviewable Codex implementation workflows. The goal is traceable AI-assisted development, not autonomous code generation without oversight.

## Operating principles

- Read the relevant architecture, plan, blueprint, and decision records before changing code.
- Treat approved architectural artifacts as constraints and source-of-truth context.
- Ask for approval before making an architectural change: a new subsystem, public contract, persistence model, security boundary, provider strategy, or major dependency.
- Keep changes small, reversible, and linked to a clear requirement or task.
- Do not create placeholder application code or speculative abstractions.
- Never hide uncertainty; record assumptions and unresolved questions.
- Do not expose secrets in code, logs, prompts, artifacts, or test fixtures.
- Avoid destructive commands and irreversible migrations unless explicitly authorized.

## Coding standards

- Use the repository's configured formatter, linter, type checker, and test runner once they are established.
- Prefer clear names, small cohesive functions, explicit data contracts, and predictable error handling.
- Validate data at boundaries, especially model output, persisted artifacts, and provider responses.
- Keep provider-specific code behind an adapter interface.
- Favor deterministic behavior for parsing, planning, validation, and state transitions.
- Add tests with behavior changes; do not weaken tests to make an implementation pass.

## File organization

- `docs/` contains architecture, development strategy, decisions, and durable project documentation.
- `src/` contains application and domain code once the stack is approved.
- `tests/` contains unit, integration, contract, and end-to-end tests.
- `scripts/` contains small repeatable development or demo utilities.
- Keep generated output and temporary execution artifacts out of source-controlled paths unless they are intentional evidence.
- Use descriptive filenames and preserve stable links from implementation records to source artifacts.

## Testing expectations

Before reporting a change complete:

1. Run formatting and static checks applicable to the changed files.
2. Run focused tests, then the full test suite when practical.
3. Exercise relevant failure paths and approval gates.
4. Record verification results in the implementation record or build log.
5. State any checks that could not be run and why.

## Documentation requirements

- Update architecture documentation when boundaries, data flow, or major components change.
- Update the development plan when scope, priority, or milestones change.
- Record meaningful decisions, alternatives, and tradeoffs.
- Keep `BUILD_LOG.md` current for major milestones, human decisions, AI contributions, and verification results.
- Every implementation workflow should identify its originating artifacts and acceptance criteria.

## How Codex should approach changes

1. Inspect the repository and relevant artifacts first.
2. Restate the intended outcome, scope, assumptions, and likely files affected.
3. Check whether the request is an implementation change or an architectural change requiring approval.
4. Produce or update a bounded plan before a multi-file change.
5. Implement the smallest complete slice.
6. Verify behavior and inspect the final diff for scope drift.
7. Report changed files, tests, risks, and follow-up decisions.

## Preserving architectural intent

When a request conflicts with an existing decision or constraint, stop and surface the conflict. Do not silently reinterpret the architecture. If a change is approved, update the relevant decision or architecture document in the same workstream and preserve traceability between the decision, plan, code, and evidence.
