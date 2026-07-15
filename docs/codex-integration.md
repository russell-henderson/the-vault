# The Vault Architect — Codex Integration and Evidence Layer

## Purpose

Milestone 3 introduces the architecture boundary between a compiled Vault specification and an AI-assisted execution. It intentionally does not make external AI requests. The first provider is a deterministic local mock so the workflow, lifecycle, failure behavior, and evidence model can be verified before credentials, network access, or provider-specific policy are introduced.

## Why a provider abstraction exists

The Vault owns architectural intent, prompt compilation, approval context, persistence, and review. A provider should only validate a prompt and produce or stream a response. Keeping that boundary explicit prevents the domain model from depending on one vendor's SDK, request format, streaming behavior, or authentication model.

The `AiProvider` interface currently exposes:

- `validate(prompt)` — checks whether a provider can accept the prompt.
- `generate(request)` — returns a normalized artifact result.
- `stream(request)` — exposes a future incremental response path.

`MockAiProvider` implements all three capabilities without network access. A future OpenAI/Codex adapter can implement the same interface without changing the execution service or UI.

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

- `POST /api/executions` — execute a stored prompt artifact through the configured provider.
- `GET /api/executions/:id` — return status, prompt, output, artifact metadata, and evidence.
- `POST /api/executions/:id/verify` — append or replace the current verification note.

## Security considerations

- No external keys or network calls are used by the current provider.
- Provider adapters must receive only the approved prompt and explicitly selected context.
- Never place credentials, tokens, or sensitive source material in prompt artifacts, outputs, or verification notes.
- Keep provider-specific authentication inside the adapter, not in domain services or UI code.
- Treat provider output as untrusted data: validate shape, cap size, label it as proposed, and require human review before applying changes.
- Future direct code execution must use an explicit sandbox, scope restrictions, timeouts, and approval gates.
- Failure messages should be useful for review without leaking provider secrets or raw authorization details.

## Future provider support

Potential adapters include an OpenAI/Codex workflow, a local model, a hosted enterprise model, or a replay provider for deterministic demos. Each adapter should normalize its response into the same artifact result and preserve provider/model metadata in a future execution metadata field. Streaming can later update a running execution without changing the lifecycle states.

The next architectural decision before external integration is the execution policy: what context Codex may access, whether it may write files, how approvals are represented, and which verification checks are mandatory before an artifact can be accepted.
