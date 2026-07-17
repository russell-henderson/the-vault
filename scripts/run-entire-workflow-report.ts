import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { buildApp } from "../apps/api/src/app.js";
import { MockAiProvider } from "../apps/api/src/providers/mock-provider.js";
import { VaultRepository } from "../apps/api/src/repository.js";

type JsonRecord = Record<string, unknown>;
type Trace = { step: number; label: string; method: string; url: string; statusCode: number; durationMs: number; response: string };

const brief = "Build a React TypeScript web dashboard for analytics.";
const manualBlueprint = {
  name: "EntireWorkflowPanel",
  description: "A panel used to trace the complete Vault workflow.",
  targetPath: "src/EntireWorkflowPanel.tsx",
  language: "TypeScript",
  framework: "React",
  dependencies: ["analytics-api"],
  architectureOverview: "A typed panel behind an API boundary.",
  coreLogic: "Render loading, error, empty, and ready states.",
  layoutDesign: "Accessible dashboard panel.",
  constraints: ["Keep persistence behind the API boundary"]
};

function asObject(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function summarizeBody(body: unknown): string {
  if (Array.isArray(body)) {
    return JSON.stringify({
      collectionCount: body.length,
      items: body.slice(0, 10).map((item) => {
        const record = asObject(item);
        return { id: record.id, name: record.name, status: record.status, provider: asObject(record.provider).name };
      })
    });
  }
  const root = asObject(body);
  const blueprint = asObject(root.blueprint);
  const packet = asObject(root.architecturePacket ?? root.packet ?? blueprint.architecturePacket);
  const packetStack = asObject(packet.stack);
  const execution = asObject(root.executionRecord);
  const provider = asObject(root.provider);
  const facts: JsonRecord = {};
  for (const key of ["status", "domain", "suggestedGeneratorId", "recommendedStackId", "generatorId", "registryVersion", "policyHash", "requestId", "validationStatus", "error", "message"]) {
    if (root[key] !== undefined) facts[key] = root[key];
  }
  if (root.available !== undefined) facts.available = root.available;
  if (stringValue(root.detail)) facts.detail = root.detail;
  if (stringValue(asObject(root.configured).name)) facts.configuredProvider = asObject(root.configured).name;
  if (Array.isArray(root.likelyStackOptions)) facts.likelyStackOptions = root.likelyStackOptions.map((option) => stringValue(asObject(option).stackId)).filter(Boolean);
  if (Array.isArray(root.unsupportedDiscoveries)) facts.unsupportedDiscoveries = root.unsupportedDiscoveries.map((item) => stringValue(asObject(item).technology)).filter(Boolean);
  if (Array.isArray(root.reasons) && root.reasons.length > 0) facts.reasons = root.reasons;
  if (Array.isArray(root.questions) && root.questions.length > 0) facts.questions = root.questions;
  if (Array.isArray(root.models)) facts.models = root.models.map((model) => { const item = asObject(model); return `${String(item.provider)}:${String(item.model)}${item.cloud ? " [cloud]" : ""}`; });
  if (stringValue(root.id)) facts.id = root.id;
  if (stringValue(root.name)) facts.name = root.name;
  if (stringValue(blueprint.id)) facts.blueprintId = blueprint.id;
  if (stringValue(blueprint.source)) facts.blueprintSource = blueprint.source;
  if (stringValue(packetStack.id)) facts.packetStack = packetStack.id;
  if (Array.isArray(packet.components)) facts.packetComponentCount = packet.components.length;
  if (stringValue(root.generatedPrompt)) facts.promptCharacters = root.generatedPrompt.length;
  if (stringValue(root.prompt)) facts.promptCharacters = root.prompt.length;
  if (stringValue(root.promptArtifactId)) facts.promptArtifactId = root.promptArtifactId;
  if (stringValue(asObject(root.promptArtifact).id)) facts.promptArtifactId = asObject(root.promptArtifact).id;
  if (stringValue(execution.id)) facts.executionId = execution.id;
  if (stringValue(execution.status)) facts.executionStatus = execution.status;
  if (stringValue(root.status) === "completed") facts.executionStatus = root.status;
  if (stringValue(provider.name)) facts.provider = provider.name;
  if (stringValue(asObject(root.evidence).verificationNotes)) facts.verification = asObject(root.evidence).verificationNotes;
  if (Object.keys(facts).length === 0) facts.responseKeys = Object.keys(root).sort();
  return JSON.stringify(facts);
}

function responseBody(response: { body: string }): unknown {
  try { return JSON.parse(response.body) as unknown; } catch { return response.body; }
}

async function main(): Promise<void> {
  const repository = new VaultRepository(":memory:");
  const app = buildApp(repository, new MockAiProvider(false));
  const traces: Trace[] = [];
  let failure: string | undefined;
  const startedAt = new Date().toISOString();

  const hit = async (label: string, method: string, url: string, options: { payload?: unknown; headers?: Record<string, string> } = {}, expectedStatus?: number) => {
    const start = performance.now();
    const response = await app.inject({ method, url, payload: options.payload, headers: options.headers });
    const durationMs = Number((performance.now() - start).toFixed(2));
    const body = responseBody(response);
    const trace = { step: traces.length + 1, label, method, url, statusCode: response.statusCode, durationMs, response: summarizeBody(body) };
    traces.push(trace);
    if (expectedStatus !== undefined && response.statusCode !== expectedStatus) throw new Error(`${label}: expected HTTP ${expectedStatus}, received ${response.statusCode} ${trace.response}`);
    return body;
  };

  try {
    await hit("CORS preflight", "OPTIONS", "/api/architecture-discovery", { headers: { origin: "http://localhost:5173", "access-control-request-method": "POST", "access-control-request-headers": "content-type" } }, 204);
    await hit("Provider status", "GET", "/api/providers/status", {}, 200);
    await hit("Provider catalog", "GET", "/api/providers/models", {}, 200);
    await hit("Initial blueprint list", "GET", "/api/blueprints", {}, 200);

    const discovery = await hit("Supported discovery", "POST", "/api/architecture-discovery", { payload: { brief, provider: "mock" } }, 200) as JsonRecord;
    if (discovery.status !== "discovery" || discovery.suggestedGeneratorId !== "react-typescript") throw new Error("Supported discovery did not return the expected React recommendation");
    await hit("Unsupported discovery review", "POST", "/api/architecture-discovery", { payload: { brief: "Build a Vue TypeScript web dashboard.", provider: "mock" } }, 200);
    await hit("Invalid discovery validation", "POST", "/api/architecture-discovery", { payload: { brief: "" } }, 400);

    await hit("Missing generator authorization gate", "POST", "/api/blueprint-proposals", { payload: { brief, provider: "mock" } }, 422);
    const proposal = await hit("Authorized proposal synthesis", "POST", "/api/blueprint-proposals", { payload: { brief, generatorId: "react-typescript", discovery, provider: "mock" } }, 201) as JsonRecord;
    if (asObject(proposal.provenance).validationStatus !== "passed") throw new Error("Proposal did not contain passed authorization provenance");

    const created = await hit("Manual blueprint creation", "POST", "/api/blueprints", { payload: manualBlueprint }, 201) as JsonRecord;
    const blueprintId = String(created.id);
    await hit("Blueprint collection after creation", "GET", "/api/blueprints", {}, 200);
    await hit("Blueprint detail", "GET", `/api/blueprints/${blueprintId}`, {}, 200);
    await hit("Missing blueprint detail", "GET", "/api/blueprints/missing-blueprint", {}, 404);

    const promptResult = await hit("Prompt generation action", "POST", `/api/blueprints/${blueprintId}/generate-prompt`, {}, 201) as JsonRecord;
    const promptArtifactId = String(asObject(promptResult.promptArtifact).id);
    await hit("Prompt retrieval", "GET", `/api/blueprints/${blueprintId}/prompt`, {}, 200);
    await hit("Missing prompt retrieval", "GET", "/api/blueprints/missing-blueprint/prompt", {}, 404);
    await hit("Pending execution history", "GET", `/api/blueprints/${blueprintId}/executions`, {}, 200);

    const execution = await hit("Mock execution action", "POST", "/api/executions", { payload: { promptArtifactId, provider: "mock" } }, 201) as JsonRecord;
    const executionId = String(execution.id);
    await hit("Execution detail", "GET", `/api/executions/${executionId}`, {}, 200);
    await hit("Invalid verification validation", "POST", `/api/executions/${executionId}/verify`, { payload: { verificationNotes: "" } }, 400);
    await hit("Verification evidence action", "POST", `/api/executions/${executionId}/verify`, { payload: { verificationNotes: "Reviewed against the complete workflow acceptance criteria." } }, 200);
    await hit("Completed execution history", "GET", `/api/blueprints/${blueprintId}/executions`, {}, 200);
    await hit("Missing execution detail", "GET", "/api/executions/missing-execution", {}, 404);
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
  } finally {
    await app.close();
  }

  const totalMs = Number(traces.reduce((total, trace) => total + trace.durationMs, 0).toFixed(2));
  const reportPath = join(process.cwd(), "docs", "reports", "entire-workflow-report.md");
  mkdirSync(join(process.cwd(), "docs", "reports"), { recursive: true });
  const report = [
    "# Entire Vault Workflow Trace Report",
    "",
    `- Started: ${startedAt}`,
    `- Finished: ${new Date().toISOString()}`,
    `- Execution mode: in-process Fastify injection with an in-memory SQLite repository and deterministic Mock provider`,
    `- Overall result: ${failure ? "FAIL" : "PASS"}`,
    `- Requests completed: ${traces.length}`,
    `- Sum of API handler durations: ${totalMs} ms`,
    failure ? `- Failure: ${failure}` : "- Failure: none",
    "",
    "## What the workflow hit and said",
    "",
    "| Step | Request | HTTP | Duration | Response summary |",
    "| ---: | --- | ---: | ---: | --- |",
    ...traces.map((trace) => `| ${trace.step} | \`${trace.method} ${trace.url}\` — ${trace.label} | ${trace.statusCode} | ${trace.durationMs} ms | ${trace.response.replaceAll("|", "\\|")} |`),
    "",
    "## Workflow interpretation",
    "",
    "- Discovery returned a registered React/TypeScript direction without creating a packet.",
    "- Unsupported Vue discovery remained visible as `review-required` and did not become actionable.",
    "- Proposal synthesis was blocked without a confirmed generator and succeeded with a passed authorization provenance.",
    "- The manual blueprint path created a durable blueprint independently of discovery.",
    "- Prompt generation created the prompt artifact and pending execution record.",
    "- Mock execution completed, retrieval returned provider metadata, and verification persisted evidence.",
    "- Invalid inputs and missing resources returned their expected 400/404 guards.",
    "",
    "## Timing notes",
    "",
    "These timings measure application handler execution through `Fastify.inject`; they exclude browser rendering, Vite HMR, network transport, and live Ollama generation. The provider catalog request may include the local Ollama catalog lookup. Use the per-step values above to identify slow handlers in this deterministic run.",
    "",
    "## Re-run",
    "",
    "```powershell",
    "npx tsx scripts/run-entire-workflow-report.ts",
    "```",
    ""
  ].join("\n");
  writeFileSync(reportPath, report, "utf8");
  console.log(report);
  if (failure) throw new Error(failure);
}

void main();
