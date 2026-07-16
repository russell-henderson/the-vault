# The Vault Architect — Codex Integration and Evidence Layer

## Purpose

The local provider milestone introduces the architecture boundary between a human brief, a structured blueprint proposal, and an AI-assisted execution. Ollama runs locally through HTTP; the deterministic mock remains available for offline development and an explicit fallback.

## Why a provider abstraction exists

The Vault owns architectural intent, prompt compilation, approval context, persistence, and review. A provider should only validate a prompt and produce or stream a response. Keeping that boundary explicit prevents the domain model from depending on one vendor's SDK, request format, streaming behavior, or authentication model.

The `AiProvider` interface currently exposes:

- `validate(prompt)` — checks whether a provider can accept the prompt.
- `generate(request)` — returns a normalized artifact result.
- `stream(request)` — exposes a future incremental response path.

`MockAiProvider` implements all three capabilities without network access. A future OpenAI/Codex adapter can implement the same interface without changing the execution service or UI.

`OllamaAiProvider` implements the same execution contract and adds strict JSON blueprint generation. The provider receives a bounded brief or compiled prompt, never unrestricted workspace access. Model output is parsed and validated against the shared Zod schemas before the UI can approve or persist it.

Configuration is environment-based:

- `AI_PROVIDER=ollama` selects Ollama for configured-provider requests.
- `OLLAMA_BASE_URL` defaults to `http://localhost:11434`.
- `OLLAMA_ANALYSIS_MODEL` defaults to `llama3.2:3b` and handles structured brief analysis and blueprint proposals.
- `OLLAMA_CREATION_MODEL` defaults to `dolphin3:8b` and handles implementation/creation artifacts.
- `OLLAMA_MODEL` remains supported as a legacy single-model override for both roles.
- `provider=mock` on `POST /api/blueprint-proposals` explicitly selects the deterministic fallback.

## Execution lifecycle

```text
PromptArtifact
    ↓
ExecutionService creates pending record
    ↓
Provider validation
    ↓
running + startedAt
    ↓
provider generate()
    ├── completed + output/artifact metadata
    └── failed + failure evidence
    ↓
Human verification note
```

The execution record stores the exact input prompt, normalized generated output, artifact type, artifact location, status, timestamps, and verification notes. The prompt artifact relationship remains intact, so a result can always be traced back to the compiled specification.

The current API surface is:

- `GET /api/providers/status` — report configured provider, model, and local availability.
- `POST /api/blueprint-proposals` — turn a natural-language brief into a validated blueprint and implementation packet.
- `POST /api/executions` — execute a stored prompt artifact through the configured provider.
- `GET /api/executions/:id` — return status, prompt, output, artifact metadata, and evidence.
- `POST /api/executions/:id/verify` — append or replace the current verification note.

## Security considerations

- Ollama calls are local HTTP requests; no hosted AI key is required.
- Provider adapters must receive only the approved prompt and explicitly selected context.
- Never place credentials, tokens, or sensitive source material in prompt artifacts, outputs, or verification notes.
- Keep provider-specific authentication inside the adapter, not in domain services or UI code.
- Treat provider output as untrusted data: validate shape, cap size, label it as proposed, and require human review before applying changes.
- Future direct code execution must use an explicit sandbox, scope restrictions, timeouts, and approval gates.
- Failure messages should be useful for review without leaking provider secrets or raw authorization details.

## Future provider support

Potential adapters include an OpenAI/Codex workflow, a hosted enterprise model, or a replay provider for deterministic demos. Each adapter should normalize its response into the same artifact result and preserve provider/model metadata. Streaming can later update a running execution without changing the lifecycle states.

The next architectural decision before external integration is the execution policy: what context Codex may access, whether it may write files, how approvals are represented, and which verification checks are mandatory before an artifact can be accepted.
