# Phase 6

## Stage 6 context

Stage 5 solved the obvious routing failures, but it also exposed a deeper product issue: the system was still trying to do **discovery and execution in one pass**. That made the analyzer too strict when the user was still exploring, and it forced the orchestrator to guess or reject too early. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/27654760/5c5ce081-fea1-4356-b158-cb0ee9201e18/Vault-Architect-Implementation-Strategy.pdf?AWSAccessKeyId=ASIA2F3EMEYE6I6DN2IF&Signature=fZikXFgSz2MjklmdJHQq1TpCEC0%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI7%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGLSgeOpNhvpH7fW06Df88UdIbcKl0n2sox%2BEYizxIJVAiARSpkpQ4QNEX5cnCS%2FnbiLsVuJm1V3dwHNrlbgNOlACCrzBAhXEAEaDDY5OTc1MzMwOTcwNSIMHKzGDbY6pep2Ir9eKtAEXnMF9qCNwgyW5WV6wva25M9gjLJ9dIk%2Ftyiwu%2B5iccLpnMlWN1bq9dpTFDIQFb5Kc%2BhHG8G8chI5Ng5MBg08pTWWGBa62CmLPK58CPn5uwfCbu1excO%2FUi8R4AOU8ADqXnxHuOHCJ9UcfYLQ25eXkHYqXE42AGfzcwLDzwfL3G8%2FUVcJznpT2%2Be2C8FkfoXriE%2FS5OZp00A0V5MHT58ljhPlfqU5AQIblgOQepX3vvkKYg4QSmFkvHvebwYqn3lm1P60HG43cz5kMOzra1UtW8N%2BpkGy%2BnVGNuk6KobGvXdxIveQibYEl7Rga6FrPpABcQwnDhGDpUDFKnlNv2FhiQ1biPGeNQAfjpMENfk3OcQ3GWb4QJcKZCUrY%2FH8nOnZe7c58tlW3gdqNWQz1ZKM%2BEcArCl8cbJQKIRqR3g1HufYsr17iHAtE1SdrNNm3V2481xecWMUX8B8D53AeJhmItqQxFISk6NttbeDVIFpWzPtqsRZ5Xza2xxaeQ0tFIxC0AKZfcXzeqvzTIhuXp12L5URQ39cMZooMnEg05I4%2FxfCwxLSOVDpQEAWaUgaMpHilcZNmH2DZCXe4lK77T2Z2uvs1DwbhbP3PplTwnQtvqRMbR8Uvc2%2Bz5CG43ZYYdl9RUIygn%2FVHGIvJmomLvmLFUscjSav63wLqHkI1ad8MZAQg%2F8hPp%2F3yrVh66FXi%2BNpKgYYyIzVOC521fIBpuqApjW2g408N7qCyGd6QW0QmNyswh3CVM1X5h22xiOMNZ7TRrQwEgEfW7ewqqPqc01ccDC0%2FObSBjqZAWKNQLX2jgvkPdESjql3MfyZESafFi%2Fy%2FQnGLamwwCh08f264S1mN%2BQ%2B27ay6xevk9wMpoEz0xNRSF06JO1xX7Azwhgil5xfgsHOnNFMu3MoBWAgnu2mqyMFDHjz2Ve4PqedCl9Rnn%2B2xah2zqFNKiZ%2FUhVBUYClXB527DC5aY%2FUcHb69IfTO%2Fc8Ir%2F26HBXCiZfiHOWMFrFtQ%3D%3D&Expires=1784269831)

Stage 6 is where we stop treating the brief as a blueprint request and instead make it a **guided conversation**. The analyzer should suggest likely stacks and ask for missing details; the orchestrator should only finalize once the brief is sufficiently narrowed and validated against the registry. [ceur-ws](https://ceur-ws.org/Vol-4034/paper67.pdf)

## The problems we are correcting

The first problem was the **static template syndrome**: the system kept falling back to legacy defaults like React/TypeScript when the brief was underspecified or when the stack wasn’t explicitly registered.  We already corrected most of that by adding hard constraint handling, review-required gating, and provider-boundary enforcement. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/27654760/5c5ce081-fea1-4356-b158-cb0ee9201e18/Vault-Architect-Implementation-Strategy.pdf?AWSAccessKeyId=ASIA2F3EMEYE6I6DN2IF&Signature=fZikXFgSz2MjklmdJHQq1TpCEC0%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEI7%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGLSgeOpNhvpH7fW06Df88UdIbcKl0n2sox%2BEYizxIJVAiARSpkpQ4QNEX5cnCS%2FnbiLsVuJm1V3dwHNrlbgNOlACCrzBAhXEAEaDDY5OTc1MzMwOTcwNSIMHKzGDbY6pep2Ir9eKtAEXnMF9qCNwgyW5WV6wva25M9gjLJ9dIk%2Ftyiwu%2B5iccLpnMlWN1bq9dpTFDIQFb5Kc%2BhHG8G8chI5Ng5MBg08pTWWGBa62CmLPK58CPn5uwfCbu1excO%2FUi8R4AOU8ADqXnxHuOHCJ9UcfYLQ25eXkHYqXE42AGfzcwLDzwfL3G8%2FUVcJznpT2%2Be2C8FkfoXriE%2FS5OZp00A0V5MHT58ljhPlfqU5AQIblgOQepX3vvkKYg4QSmFkvHvebwYqn3lm1P60HG43cz5kMOzra1UtW8N%2BpkGy%2BnVGNuk6KobGvXdxIveQibYEl7Rga6FrPpABcQwnDhGDpUDFKnlNv2FhiQ1biPGeNQAfjpMENfk3OcQ3GWb4QJcKZCUrY%2FH8nOnZe7c58tlW3gdqNWQz1ZKM%2BEcArCl8cbJQKIRqR3g1HufYsr17iHAtE1SdrNNm3V2481xecWMUX8B8D53AeJhmItqQxFISk6NttbeDVIFpWzPtqsRZ5Xza2xxaeQ0tFIxC0AKZfcXzeqvzTIhuXp12L5URQ39cMZooMnEg05I4%2FxfCwxLSOVDpQEAWaUgaMpHilcZNmH2DZCXe4lK77T2Z2uvs1DwbhbP3PplTwnQtvqRMbR8Uvc2%2Bz5CG43ZYYdl9RUIygn%2FVHGIvJmomLvmLFUscjSav63wLqHkI1ad8MZAQg%2F8hPp%2F3yrVh66FXi%2BNpKgYYyIzVOC521fIBpuqApjW2g408N7qCyGd6QW0QmNyswh3CVM1X5h22xiOMNZ7TRrQwEgEfW7ewqqPqc01ccDC0%2FObSBjqZAWKNQLX2jgvkPdESjql3MfyZESafFi%2Fy%2FQnGLamwwCh08f264S1mN%2BQ%2B27ay6xevk9wMpoEz0xNRSF06JO1xX7Azwhgil5xfgsHOnNFMu3MoBWAgnu2mqyMFDHjz2Ve4PqedCl9Rnn%2B2xah2zqFNKiZ%2FUhVBUYClXB527DC5aY%2FUcHb69IfTO%2Fc8Ir%2F26HBXCiZfiHOWMFrFtQ%3D%3D&Expires=1784269831)

The second problem is now the product design itself: the app should not require the user to know the exact stack upfront. It should let the user describe the idea, let the analyzer suggest options, and then let the user refine or confirm before orchestration. [cs.wm](https://www.cs.wm.edu/~dcschmidt/PDF/Preference_Driven_Refinement_of_Prompts.pdf)

The third problem is overloading one prompt with too many responsibilities. The current system becomes fragile when one stage is asked to infer domain, choose stack, validate compatibility, and generate the final architecture all at once. [emergentmind](https://www.emergentmind.com/topics/prompt-engineering-pipeline)

## The correction strategy

Stage 6 should formalize a **two-stage consultative loop**:

- **Analyzer**: reads the user idea, identifies the domain, suggests 2–3 likely stacks from the registry, and asks clarifying questions if needed. It does not finalize anything. [arxiv](https://arxiv.org/html/2406.10101v2)
- **Orchestrator**: consumes the refined intent plus the registry, validates the selection, and produces the final blueprint manifest. If the requested stack is unsupported or conflicting, it returns `REVIEW_REQUIRED` rather than inventing a substitute. [arxiv](https://arxiv.org/html/2607.00345v1)

That means the registry becomes the source of truth, and the prompts become a controlled interface for discovery and validation instead of a fallback mechanism. [reve](https://www.reve.cloud/blog/designing-apis-specifically-for-consumption-by-llm-agents)

## What we are asking Codex to do now

We are not asking Codex to redesign the whole app again. The remaining job is to align the product flow with the architecture we already established: discovery first, validation second, execution last. [developers.openai](https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide)

Specifically, stage 6 should focus on:

- making the registry machine-readable,
- passing a compact registry slice to the analyzer,
- keeping the full registry in the app layer for final validation,
- and preserving the `REVIEW_REQUIRED` state as a normal outcome rather than a failure. [insiderllm](https://insiderllm.com/guides/structured-output-local-llms/)

## How to describe the desired end state

The clean end state is:

1. User enters an app idea in plain language.
2. Analyzer returns a ranked stack suggestion plus missing-info questions.
3. User refines the brief.
4. Orchestrator validates against the registry and emits markdown or JSON.
5. If the stack cannot be verified, the system stops at review-required. [ceur-ws](https://ceur-ws.org/Vol-4034/paper67.pdf)

That is the operating model Codex should be brought up to speed on. It is not a one-shot generator anymore; it is a guided architecture planning system with a strict registry-backed handoff. [flow-next](https://flow-next.dev/orchestration/)

## Paste-ready summary for Codex

```text
We are now at stage 6 after committing stage 5.

Stage 5 fixed the obvious static-template and fallback problems by enforcing hard constraints, registry validation, and provider-boundary rejection. The system no longer silently falls back to React/Tailwind or other legacy templates.

Stage 6 is about product flow, not more routing fixes. The real goal is to decouple discovery from execution:

1. Analyzer:
- Accepts a plain-language app idea.
- Suggests 2-3 likely stacks from the registry.
- Returns confidence, missing details, and clarifying questions.
- Does not finalize a blueprint.
- If the brief is too ambiguous, it returns a discovery state or review-needed state.

2. Orchestrator:
- Runs only after the user refines or confirms the analyzer’s suggestion.
- Performs a strict registry lookup.
- If the stack is unsupported or conflicts with registry constraints, returns REVIEW_REQUIRED.
- If valid, generates the final BlueprintManifest in markdown and/or JSON.

The problems we are correcting:
- The system previously forced a single-pass guess and fell back to legacy defaults.
- The user should not need to know the exact stack upfront.
- Discovery and execution are currently too tightly coupled.
- One prompt cannot safely do domain inference, stack selection, validation, and blueprint generation at the same time.

The intended end state:
- User describes the app idea in natural language.
- Analyzer suggests the likely architecture direction.
- User refines the brief.
- Orchestrator validates and emits the finalized blueprint.
- Unsupported or conflicting requests are cleanly routed to REVIEW_REQUIRED instead of being substituted.

Do not write code yet. First confirm that this stage-6 interpretation matches the desired workflow and identify any remaining design gaps.
```

If you want, I can now turn that into a **shorter, more directive plan-mode version** for Codex 5.6 that reads like a task brief rather than a design memo.

## 1) `system_registry.schema.json`

This is the JSON Schema for your canonical registry file.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://vault-architect.local/schemas/system_registry.schema.json",
  "title": "Vault Architect System Registry",
  "type": "object",
  "required": ["version", "generatedAt", "stacks"],
  "additionalProperties": false,
  "properties": {
    "version": {
      "type": "string",
      "description": "Registry schema/version identifier"
    },
    "generatedAt": {
      "type": "string",
      "format": "date-time"
    },
    "stacks": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/stackEntry"
      }
    }
  },
  "$defs": {
    "stackEntry": {
      "type": "object",
      "required": [
        "stackId",
        "platform",
        "domain",
        "language",
        "frameworks",
        "requiredComponentKinds",
        "constraints",
        "prohibitedSubstitutions",
        "supportedSignals",
        "status"
      ],
      "additionalProperties": false,
      "properties": {
        "stackId": {
          "type": "string",
          "description": "Unique registry ID, e.g. react-typescript"
        },
        "platform": {
          "type": "string",
          "enum": ["mobile", "desktop", "web", "backend", "embedded", "cli"]
        },
        "domain": {
          "type": "string",
          "description": "Human-readable domain profile"
        },
        "language": {
          "type": "string"
        },
        "frameworks": {
          "type": "array",
          "items": { "type": "string" }
        },
        "requiredComponentKinds": {
          "type": "array",
          "items": { "type": "string" }
        },
        "constraints": {
          "type": "array",
          "items": { "type": "string" }
        },
        "prohibitedSubstitutions": {
          "type": "array",
          "items": { "type": "string" }
        },
        "supportedSignals": {
          "type": "array",
          "items": { "type": "string" }
        },
        "status": {
          "type": "string",
          "enum": ["active", "preview", "deprecated", "disabled"]
        },
        "confidenceHints": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "recommendedFor": {
              "type": "array",
              "items": { "type": "string" }
            },
            "avoidWhen": {
              "type": "array",
              "items": { "type": "string" }
            }
          }
        }
      }
    }
  }
}
```

## 2) `system_registry.json` example

This is a minimal example of the actual registry data.

```json
{
  "version": "1.0.0",
  "generatedAt": "2026-07-17T05:52:00Z",
  "stacks": [
    {
      "stackId": "swift-spritekit",
      "platform": "mobile",
      "domain": "mobile-physics",
      "language": "Swift",
      "frameworks": ["SpriteKit"],
      "requiredComponentKinds": [
        "PhysicsController",
        "SceneLayer",
        "EntityNode",
        "InputController",
        "PersistenceManager"
      ],
      "constraints": [
        "Keep physics state inside the scene boundary.",
        "Keep entity lifecycle and collision rules explicit."
      ],
      "prohibitedSubstitutions": ["React", "Tailwind", "Flet", "SwiftUI"],
      "supportedSignals": ["swift", "spritekit", "ios", "mobile", "physics", "collision", "sprite", "game loop"],
      "status": "active",
      "confidenceHints": {
        "recommendedFor": ["native iOS game-like interactions", "physics-driven mobile apps"],
        "avoidWhen": ["declarative SwiftUI-only requests", "web dashboards"]
      }
    },
    {
      "stackId": "python-flet",
      "platform": "desktop",
      "domain": "desktop-ui",
      "language": "Python",
      "frameworks": ["Flet"],
      "requiredComponentKinds": [
        "ViewLayer",
        "EventController",
        "StateModel",
        "ServiceAdapter",
        "PersistenceManager"
      ],
      "constraints": [
        "Keep persistence behind the adapter boundary.",
        "Keep desktop event handlers separate from view composition."
      ],
      "prohibitedSubstitutions": ["React", "Tailwind", "SwiftUI", "SpriteKit"],
      "supportedSignals": ["python", "flet", "desktop", "window", "form", "native app"],
      "status": "active"
    },
    {
      "stackId": "react-typescript",
      "platform": "web",
      "domain": "web-dashboard",
      "language": "TypeScript",
      "frameworks": ["React", "React + Tailwind"],
      "requiredComponentKinds": [
        "ViewLayer",
        "StateController",
        "ApiAdapter",
        "AccessibilityLayer",
        "PersistenceManager"
      ],
      "constraints": [
        "Keep server persistence behind the API boundary.",
        "Render explicit loading, error, empty, and ready states.",
        "Preserve keyboard accessibility."
      ],
      "prohibitedSubstitutions": ["SwiftUI", "SpriteKit", "Flet"],
      "supportedSignals": ["react", "typescript", "tsx", "web", "browser", "dashboard", "analytics", "panel", "tailwind"],
      "status": "active"
    }
  ]
}
```

## 3) Analyzer prompt payload

Use this as the **system** or **developer** prompt for the Analyzer stage.

```text
You are the Vault Discovery Consultant.

Your job:
- Read the user's app idea.
- Use the provided registry excerpt as your source of truth.
- Identify the core domain.
- Suggest 2-3 likely stack options from the registry only.
- Identify missing technical details that would help narrow the selection.
- Return a structured summary.
- Do NOT finalize the blueprint.
- Do NOT invent unsupported stacks.
- If the user's request conflicts with the registry or is too ambiguous, surface that clearly.

Rules:
1. Only recommend stacks present in the provided registry excerpt.
2. Rank options by fit and confidence.
3. Ask 2-3 clarifying questions if needed.
4. If no stack fits, return status = REVIEW_REQUIRED.
5. Keep the output concise, structured, and machine-readable.

Output JSON shape:
{
  "status": "DISCOVERY" | "REVIEW_REQUIRED",
  "domain": "...",
  "likelyStackOptions": [
    {
      "stackId": "...",
      "reason": "...",
      "confidence": 0.0
    }
  ],
  "missingInfo": ["..."],
  "clarifyingQuestions": ["..."],
  "notes": ["..."]
}
```

### Analyzer user payload example

```json
{
  "userBrief": "I want to build a native mobile app for note-taking with offline storage, local search, tags, sync, and accessibility.",
  "registryExcerpt": {
    "stacks": [
      {
        "stackId": "swift-spritekit",
        "platform": "mobile",
        "domain": "mobile-physics",
        "language": "Swift",
        "frameworks": ["SpriteKit"],
        "constraints": ["Keep physics state inside the scene boundary."],
        "prohibitedSubstitutions": ["React", "Tailwind", "Flet", "SwiftUI"],
        "supportedSignals": ["swift", "spritekit", "ios", "mobile"]
      },
      {
        "stackId": "react-typescript",
        "platform": "web",
        "domain": "web-dashboard",
        "language": "TypeScript",
        "frameworks": ["React", "React + Tailwind"],
        "constraints": ["Preserve keyboard accessibility."],
        "prohibitedSubstitutions": ["SwiftUI", "SpriteKit", "Flet"],
        "supportedSignals": ["react", "typescript", "tsx", "web", "browser", "dashboard"]
      }
    ]
  }
}
```

## 4) Orchestrator prompt payload

Use this as the **system** or **developer** prompt for the Orchestrator stage.

```text
You are the Lead Architect.

Your job:
- Consume the Analyzer output and the full registry.
- Validate the selected stack against the registry.
- If the stack is supported, produce a finalized BlueprintManifest.json.
- If the stack is unsupported, ambiguous, or conflicts with registry constraints, return REVIEW_REQUIRED.
- Never substitute a different language, framework, or platform to "make it work."

Rules:
1. Cross-reference stackId against the registry.
2. Check platform, language, frameworks, constraints, and prohibited substitutions.
3. If any hard mismatch exists, return REVIEW_REQUIRED.
4. If valid, produce a bounded architecture manifest only.
5. Do not generate implementation code.

Output JSON shape:
{
  "status": "VALIDATED" | "REVIEW_REQUIRED",
  "stackSpecification": {
    "stackId": "...",
    "platform": "...",
    "language": "...",
    "frameworks": ["..."]
  },
  "architecture": {
    "overview": "...",
    "requiredComponents": ["..."],
    "directoryTree": ["..."],
    "constraints": ["..."],
    "dependencies": ["..."]
  },
  "warnings": ["..."],
  "reasons": ["..."]
}
```

### Orchestrator user payload example

```json
{
  "analyzerOutput": {
    "status": "DISCOVERY",
    "domain": "mobile",
    "likelyStackOptions": [
      {
        "stackId": "swift-spritekit",
        "reason": "Only registered mobile stack in the current registry excerpt.",
        "confidence": 0.82
      }
    ],
    "missingInfo": ["Does the app need game-style interactions or pure forms?"],
    "clarifyingQuestions": ["Is this a game-like app or a utility app?"],
    "notes": ["No SwiftUI stack is registered."]
  },
  "userFinalSelection": {
    "stackId": "swift-spritekit"
  },
  "registry": {
    "version": "1.0.0",
    "stacks": [...]
  }
}
```

## 5) Recommended API alignment

This approach fits best if your API treats the registry as an application-level artifact, not something fully embedded into every prompt. Keep the full registry in code, pass only the relevant excerpt to the Analyzer, then give the Orchestrator the analyzer output plus the exact selected registry item for verification. [towardsdatascience](https://towardsdatascience.com/context-engineering-for-rag-the-four-typed-inputs-behind-every-rag-answer/)

---

STAGE 6 — NON-NEGOTIABLE WORKFLOW

You are in PLAN mode only.

GOAL

- Decouple discovery from execution.
- Make Vault Architect consultative, registry-grounded, and review-safe.

MUST DO

- Treat the user’s first brief as discovery, not a final blueprint request.
- Analyzer must suggest likely stacks from the registry and ask clarifying questions.
- Orchestrator must only run after the brief is refined or confirmed.
- Orchestrator must validate against the full registry before any blueprint generation.
- If the stack is unsupported or conflicts with the registry, return REVIEW_REQUIRED.
- Keep the registry as the source of truth.
- Preserve manual review and do not bypass it with hidden defaults.

MUST NOT DO

- Do not collapse discovery and execution into one step.
- Do not force a final stack on the first pass.
- Do not reintroduce React/Tailwind or other legacy defaults as fallback behavior.
- Do not invent unsupported stacks.
- Do not generate code yet.
- Do not change unrelated systems.

EXPECTED END STATE

- User describes the idea.
- Analyzer suggests stack direction and clarifying questions.
- User refines the brief.
- Orchestrator validates and emits the final architecture packet.
- Unsupported requests stop at REVIEW_REQUIRED.

## Implementation status — 2026-07-17

Stage 6 is implemented with the following concrete boundaries:

- `POST /api/architecture-discovery` performs ephemeral registry-backed discovery and returns no blueprint or packet.
- `POST /api/blueprint-proposals` requires a confirmed `generatorId` and re-extracts constraints from the refined brief before provider access.
- The Analyzer receives a compact registry slice; the Orchestrator resolves the selected generator against the full registry.
- Ollama and Mock expose discovery-specific provider operations separate from blueprint synthesis.
- Unsupported model generator ids, unknown frameworks, conflicting constraints, and missing confirmation return `review-required` without synthesis.
- The UI requires Analyze → select → Confirm & synthesize before displaying a proposal.
- Discovery is not persisted as a final artifact; successful packets retain confirmed handoff provenance.
