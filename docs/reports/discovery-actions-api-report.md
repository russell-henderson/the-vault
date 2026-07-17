# Discovery and Actions API Coverage Report

## Scope

This report records the deterministic API contract test in [`tests/discovery-actions-api.test.ts`](../../tests/discovery-actions-api.test.ts). It exercises the Fastify application through `app.inject` with an in-memory repository and the deterministic Mock provider, so it does not mutate the development database or depend on an external model response.

## Verification result

- Date: 2026-07-17
- Test command: `npm test`
- Result: **PASS**
- Suite result: 17 test files, 67 tests passed
- Comprehensive flow: 1 test, 24 injected requests
- Additional focused provider coverage: `tests/ollama-provider.test.ts`
- `npm run typecheck`: **PASS**
- `npm run build`: **PASS**
- `npm run seed:demo`: **PASS**
- `git diff --check`: **PASS**; Git reported existing LF/CRLF conversion warnings only

## Endpoint coverage

The application exposes 13 route patterns, plus the CORS preflight exercised by the test.

| Area | Endpoint | Covered behavior | Result |
| --- | --- | --- | --- |
| CORS | `OPTIONS /api/architecture-discovery` | Browser preflight with origin and requested headers | 204 |
| Providers | `GET /api/providers/status` | Configured provider health and metadata | 200 |
| Providers | `GET /api/providers/models` | Catalog access, deterministic mock availability, cloud-tag contract | 200 |
| Discovery | `POST /api/architecture-discovery` | Valid React/TypeScript discovery | 200, `discovery` |
| Discovery | `POST /api/architecture-discovery` | Unsupported Vue discovery remains visible and non-actionable | 200, `review-required` |
| Discovery | `POST /api/architecture-discovery` | Invalid brief validation | 400 |
| Proposal | `POST /api/blueprint-proposals` | Missing confirmed generator gate | 422, no persistence |
| Proposal | `POST /api/blueprint-proposals` | Authorized React synthesis and provenance | 201 |
| Blueprints | `POST /api/blueprints` | Invalid manual input and valid trusted-input creation | 400 / 201 |
| Blueprints | `GET /api/blueprints` | Empty and populated collection retrieval | 200 |
| Blueprints | `GET /api/blueprints/:id` | Existing and missing blueprint retrieval | 200 / 404 |
| Prompt action | `POST /api/blueprints/:id/generate-prompt` | Prompt artifact and pending execution creation | 201 |
| Prompt retrieval | `GET /api/blueprints/:id/prompt` | Existing and missing prompt retrieval | 200 / 404 |
| Executions | `GET /api/blueprints/:id/executions` | Pending and completed execution history | 200 |
| Executions | `POST /api/executions` | Mock provider execution and metadata persistence | 201 |
| Executions | `GET /api/executions/:id` | Execution detail and prompt join | 200 |
| Executions | `GET /api/executions/:id` | Missing execution handling | 404 |
| Verification | `POST /api/executions/:id/verify` | Invalid note validation and successful evidence update | 400 / 200 |

## Assertions of architectural behavior

- Discovery returns recommendations and unsupported discoveries without an `ArchitecturePacket` or blueprint.
- Unsupported discovery is represented as a handled review state rather than a browser-visible HTTP failure.
- Final proposal generation requires a confirmed generator and returns `review-required` before persistence when absent.
- Successful synthesis returns the selected registry generator and authorization provenance including request ID, registry version, policy hash, and passed validation status.
- The manual structured blueprint endpoint remains functional independently of discovery.
- Prompt generation creates a prompt artifact and execution record.
- Execution retrieval includes provider metadata and the source prompt.
- Verification notes are persisted and returned as evidence.
- Missing resources and malformed payloads return structured 400/404 responses.
- Cloud-tagged Ollama model names are not treated as local models, including suffix forms such as `:120b-cloud`.

## Deliberate test boundary

The test uses the Mock provider for deterministic synthesis. It verifies that the Ollama catalog endpoint is reachable and that its catalog contract is enforced, while live Ollama generation, network failure recovery, and unavailable-model branches remain covered by the dedicated Ollama/provider-selection tests rather than this end-to-end workflow.

## Reproduction

```powershell
npm test -- --run tests/discovery-actions-api.test.ts
npm test
npm run typecheck
npm run build
npm run seed:demo
git diff --check
```
