# Logical Synthesis Engine: Constraint-Driven Refactoring

## 1. Problem Statement
The current classification logic relies on a signal-scoring heuristic (`normalized.includes(term)`) in `packages/prompts/src/registry.ts`. This approach creates a "keyword magnet" effect where broad terms (e.g., "Swift") or even partial matches pull briefs into incorrect architecture templates (e.g., forcing a React-based web dashboard onto a mobile physics app).

The orchestrator currently prioritizes signal-based confidence over hard domain constraints. If no generator reaches a threshold, or if ambiguous signals exist, the system risks falling back to the highest-scoring registered template rather than enforcing an explicit architectural boundary.

## 2. Refactoring Goal
Shift the orchestrator and registry from **pattern-matching** to **intent-parsing**. The system must:
1.  **Extract explicit constraints** from the brief *before* scoring signals.
2.  **Enforce architectural boundaries** (e.g., rejecting web-only templates for mobile intent).
3.  **Synthesize architectures** from a bounded constraint space (registry-provided components and constraints) rather than injecting pre-defined templates.
4.  **Enforce Review Required** paths for ambiguous or unsupported domains, rather than failing over to "best guess" templates.

## 3. Required Implementation Plan

### A. Constraint Extraction Gate
Add a `ConstraintExtractor` that runs before `registry.classify`. It must identify:
- **Platform/Stack Requirements:** e.g., "iOS", "Swift", "Desktop".
- **Explicit Prohibitions:** e.g., "no web", "no React".
- **Stack Mentions:** Tokens that define the technology stack.

### B. Orchestrator Integration
Update `ArchitectureOrchestrator.prepare` to:
1.  Run `extractConstraints(brief)`.
2.  Detect conflicts: If the brief specifies a platform (e.g., mobile) but the registry has no compatible generator, or if the user explicitly prohibits the chosen stack → Return `review-required`.
3.  Pass `constraints` to `registry.classify` to bias or filter candidate generators.
4.  Throw errors in `MockProvider` or `OllamaProvider` if a synthesis request is attempted without a valid, constrained generator context.

### C. Refined Registry Scoring
1.  **Token-Based Logic:** Replace `normalized.includes(term)` in `packages/prompts/src/registry.ts` with explicit token/phrase matching.
2.  **Constraint-Biased Filtering:** In `GeneratorRegistry.classify`, use the extracted constraints to drop incompatible generators before calculating the confidence score.
3.  **Semantic Integrity:** Maintain a strict `0.80` threshold for semantic integrity to prevent ambiguous briefs from passing.
4.  **Placeholder Stubs:** If a popular framework (like SwiftUI) lacks a full generator, register a placeholder stub that routes to `Review Required` with a helpful message, rather than allowing a conflict to trigger a fallback.

### D. First-Principles Synthesis
Update the `buildInstruction` method for generators:
- Remove all "Full-Template" injection logic.
- Instruct the LLM to derive the architecture from first principles using:
    - `RequiredComponentKinds`
    - `ArchitecturalTraits`
    - `HardConstraints`
    - `ProhibitedSubstitutions`
- Add a guardrail instruction: *"If the brief explicitly requests a stack outside allowed choices, do not synthesize. Output a REVIEW_REQUIRED response."*

## 4. Verification Requirements
- **Regression Testing:**
    - Test "No Web/React" prohibition against web generators.
    - Test "SwiftUI" (if stubbed) vs "SpriteKit" intent.
    - Test ambiguous intent triggers `Review Required`.
- **API Tests:** Ensure invalid/prohibited synthesis requests return `422 Review Required`.
