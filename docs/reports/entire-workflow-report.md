# Entire Vault Workflow Trace Report

- Started: 2026-07-17T09:38:46.235Z
- Finished: 2026-07-17T09:38:46.374Z
- Execution mode: in-process Fastify injection with an in-memory SQLite repository and deterministic Mock provider
- Overall result: PASS
- Requests completed: 23
- Sum of API handler durations: 134.76 ms
- Failure: none

## What the workflow hit and said

| Step | Request | HTTP | Duration | Response summary |
| ---: | --- | ---: | ---: | --- |
| 1 | `OPTIONS /api/architecture-discovery` — CORS preflight | 204 | 28.18 ms | {"responseKeys":[]} |
| 2 | `GET /api/providers/status` — Provider status | 200 | 2.02 ms | {"available":true,"detail":"Deterministic mock is ready","configuredProvider":"mock"} |
| 3 | `GET /api/providers/models` — Provider catalog | 200 | 68.46 ms | {"detail":"Ollama catalog refreshed","models":["ollama:deepseek-r1:8b","ollama:dolphin3:8b","ollama:llama2-uncensored:latest","ollama:llama3.2-16k:latest","ollama:llama3.2:3b","ollama:llava:latest","ollama:mxbai-embed-large:335m","ollama:nomic-embed-text:v1.5","ollama:phi3.5:3.8b","ollama:qwen3-vl:4b","ollama:qwen3.5:9b","mock:deterministic-local"]} |
| 4 | `GET /api/blueprints` — Initial blueprint list | 200 | 0.8 ms | {"collectionCount":0,"items":[]} |
| 5 | `POST /api/architecture-discovery` — Supported discovery | 200 | 7.6 ms | {"status":"discovery","domain":"web-dashboard","suggestedGeneratorId":"react-typescript","recommendedStackId":"react-typescript","registryVersion":"registry-v3-authority","likelyStackOptions":["react-typescript"],"unsupportedDiscoveries":[]} |
| 6 | `POST /api/architecture-discovery` — Unsupported discovery review | 200 | 3.31 ms | {"status":"review-required","domain":null,"suggestedGeneratorId":null,"recommendedStackId":null,"registryVersion":"registry-v3-authority","likelyStackOptions":[],"unsupportedDiscoveries":["vue"],"reasons":["Unrecognized technology mentions require review: vue.","No registered generator satisfies the requested constraints: web, typescript."]} |
| 7 | `POST /api/architecture-discovery` — Invalid discovery validation | 400 | 1.63 ms | {"error":"Invalid discovery brief"} |
| 8 | `POST /api/blueprint-proposals` — Missing generator authorization gate | 422 | 1.97 ms | {"status":"review-required","reasons":["A confirmed generatorId is required before final synthesis."],"questions":["Which platform, language, or framework should the architecture target?"]} |
| 9 | `POST /api/blueprint-proposals` — Authorized proposal synthesis | 201 | 7.06 ms | {"status":"validated","blueprintSource":"mock","packetStack":"react-typescript","packetComponentCount":5,"provider":"mock"} |
| 10 | `POST /api/blueprints` — Manual blueprint creation | 201 | 2.08 ms | {"id":"aec2ce97-82b3-4635-9106-0f62ed916ced","name":"EntireWorkflowPanel"} |
| 11 | `GET /api/blueprints` — Blueprint collection after creation | 200 | 0.82 ms | {"collectionCount":1,"items":[{"id":"aec2ce97-82b3-4635-9106-0f62ed916ced","name":"EntireWorkflowPanel"}]} |
| 12 | `GET /api/blueprints/aec2ce97-82b3-4635-9106-0f62ed916ced` — Blueprint detail | 200 | 0.45 ms | {"id":"aec2ce97-82b3-4635-9106-0f62ed916ced","name":"EntireWorkflowPanel"} |
| 13 | `GET /api/blueprints/missing-blueprint` — Missing blueprint detail | 404 | 0.35 ms | {"error":"Blueprint not found"} |
| 14 | `POST /api/blueprints/aec2ce97-82b3-4635-9106-0f62ed916ced/generate-prompt` — Prompt generation action | 201 | 0.88 ms | {"blueprintId":"aec2ce97-82b3-4635-9106-0f62ed916ced","blueprintSource":"human","promptArtifactId":"0f480c6d-3775-459d-aab0-3699cb2c7523","executionId":"0c3629da-24a2-4e6a-99ed-d7b884ffe49a","executionStatus":"pending"} |
| 15 | `GET /api/blueprints/aec2ce97-82b3-4635-9106-0f62ed916ced/prompt` — Prompt retrieval | 200 | 0.47 ms | {"id":"0f480c6d-3775-459d-aab0-3699cb2c7523","promptCharacters":922} |
| 16 | `GET /api/blueprints/missing-blueprint/prompt` — Missing prompt retrieval | 404 | 0.26 ms | {"error":"Blueprint not found"} |
| 17 | `GET /api/blueprints/aec2ce97-82b3-4635-9106-0f62ed916ced/executions` — Pending execution history | 200 | 0.52 ms | {"collectionCount":1,"items":[{"id":"0c3629da-24a2-4e6a-99ed-d7b884ffe49a","status":"pending"}]} |
| 18 | `POST /api/executions` — Mock execution action | 201 | 2.11 ms | {"status":"completed","id":"d6e047ae-fe3a-45d0-993b-2f3144945ee6","promptCharacters":922,"promptArtifactId":"0f480c6d-3775-459d-aab0-3699cb2c7523","executionStatus":"completed","provider":"mock"} |
| 19 | `GET /api/executions/d6e047ae-fe3a-45d0-993b-2f3144945ee6` — Execution detail | 200 | 2.08 ms | {"status":"completed","id":"d6e047ae-fe3a-45d0-993b-2f3144945ee6","promptCharacters":922,"promptArtifactId":"0f480c6d-3775-459d-aab0-3699cb2c7523","executionStatus":"completed","provider":"mock"} |
| 20 | `POST /api/executions/d6e047ae-fe3a-45d0-993b-2f3144945ee6/verify` — Invalid verification validation | 400 | 1.86 ms | {"error":"Invalid verification note"} |
| 21 | `POST /api/executions/d6e047ae-fe3a-45d0-993b-2f3144945ee6/verify` — Verification evidence action | 200 | 1.2 ms | {"status":"completed","id":"d6e047ae-fe3a-45d0-993b-2f3144945ee6","promptCharacters":922,"promptArtifactId":"0f480c6d-3775-459d-aab0-3699cb2c7523","executionStatus":"completed","provider":"mock","verification":"Reviewed against the complete workflow acceptance criteria."} |
| 22 | `GET /api/blueprints/aec2ce97-82b3-4635-9106-0f62ed916ced/executions` — Completed execution history | 200 | 0.41 ms | {"collectionCount":2,"items":[{"id":"d6e047ae-fe3a-45d0-993b-2f3144945ee6","status":"completed","provider":"mock"},{"id":"0c3629da-24a2-4e6a-99ed-d7b884ffe49a","status":"pending"}]} |
| 23 | `GET /api/executions/missing-execution` — Missing execution detail | 404 | 0.24 ms | {"error":"Execution record not found"} |

## Workflow interpretation

- Discovery returned a registered React/TypeScript direction without creating a packet.
- Unsupported Vue discovery remained visible as `review-required` and did not become actionable.
- Proposal synthesis was blocked without a confirmed generator and succeeded with a passed authorization provenance.
- The manual blueprint path created a durable blueprint independently of discovery.
- Prompt generation created the prompt artifact and pending execution record.
- Mock execution completed, retrieval returned provider metadata, and verification persisted evidence.
- Invalid inputs and missing resources returned their expected 400/404 guards.

## Timing notes

These timings measure application handler execution through `Fastify.inject`; they exclude browser rendering, Vite HMR, network transport, and live Ollama generation. The provider catalog request may include the local Ollama catalog lookup. Use the per-step values above to identify slow handlers in this deterministic run.

## Re-run

```powershell
npx tsx scripts/run-entire-workflow-report.ts
```
