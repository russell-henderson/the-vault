import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { generateCodexPrompt, generateContextSummary, generateCoreDocumentPrompt } from "@the-vault/prompts";
import { blueprintInputSchema, blueprintMutationSchema, blueprintProposalSchema, blueprintWorkspaceSchema, briefInputSchema, discoveryInputSchema, discoveryResultSchema, embeddingProbeSchema, executionCreateSchema, generateCoreDocsInputSchema, providerStatusSchema, rerollDocumentInputSchema, validationReportSchema, verificationInputSchema, type BlueprintWorkspace, type CoreDocumentFilename, type ExecutionRecord, type ProviderSelection, type WorkspaceDocument } from "@the-vault/shared";
import { VaultRepository } from "./repository.js";
import { MockAiProvider } from "./providers/mock-provider.js";
import type { AiProvider } from "./providers/types.js";
import { createConfiguredProvider } from "./providers/configured-provider.js";
import { isRemovedOllamaModel, OllamaAiProvider } from "./providers/ollama-provider.js";
import { OpenRouterEmbeddingProvider } from "./providers/openrouter-embedding-provider.js";
import { ExecutionService } from "./services/execution-service.js";
import { ArchitectureAnalyzer } from "./services/architecture-analyzer.js";
import { ArchitectureOrchestrator } from "./services/architecture-orchestrator.js";

const mockSelection: ProviderSelection = { provider: "mock", model: "deterministic-local" };
const coreDocumentFilenames: CoreDocumentFilename[] = ["README.md", "ARCHITECTURE.md", "API.md", "DATA_MODELS.md", "COMPONENTS.md", "DEVELOPMENT_PLAN.md", "TESTING_STRATEGY.md", "DEPLOYMENT.md", "TROUBLESHOOTING.md"];

export type CompanionSecurityConfig = {
  allowedOrigin: string;
  token: string;
  expiresAt: number;
};

export type BuildAppOptions = { companionSecurity?: CompanionSecurityConfig };

function hasValidBearerToken(header: string | undefined, token: string): boolean {
  const match = /^Bearer ([A-Za-z0-9_-]+)$/.exec(header ?? "");
  if (!match || match[1].length !== token.length) return false;
  let difference = 0;
  for (let index = 0; index < token.length; index += 1) difference |= token.charCodeAt(index) ^ match[1].charCodeAt(index);
  return difference === 0;
}

function workspaceFromRecords(blueprint: BlueprintWorkspace["blueprint"], records: ExecutionRecord[]): BlueprintWorkspace {
  const prd = records.find((record) => record.artifactType === "PRD" && record.status === "completed");
  const documents: WorkspaceDocument[] = [{
    filename: "PRD.md",
    status: prd ? "completed" : "pending",
    content: prd?.generatedOutput ?? "",
    executionId: prd?.id ?? null,
    promptArtifactId: prd?.promptArtifactId ?? null,
    sourceExecutionId: null,
    provider: prd?.provider,
    updatedAt: prd ? prd.completedAt ?? prd.createdAt : null
  }];

  for (const filename of coreDocumentFilenames) {
    const fileRecords = records.filter((record) => record.documentFilename === filename);
    const current = fileRecords[0];
    const completed = fileRecords.find((record) => record.status === "completed");
    documents.push({
      filename,
      status: current?.status === "completed" || current?.status === "failed" || current?.status === "running" ? current.status : "pending",
      content: completed?.generatedOutput ?? "",
      executionId: current?.id ?? null,
      promptArtifactId: current?.promptArtifactId ?? null,
      sourceExecutionId: current?.sourceExecutionId ?? prd?.id ?? null,
      error: current?.status === "failed" ? current.verificationNotes : undefined,
      provider: current?.provider ?? completed?.provider,
      updatedAt: current ? current.completedAt ?? current.createdAt : completed ? completed.completedAt ?? completed.createdAt : null
    });
  }

  return blueprintWorkspaceSchema.parse({ blueprint, documents, prdExecutionId: prd?.id ?? null });
}

function configuredSelections(currentProvider: AiProvider): { analysis: ProviderSelection; creation: ProviderSelection } {
  if (currentProvider.name !== "ollama") return { analysis: mockSelection, creation: mockSelection };
  const ollama = currentProvider as OllamaAiProvider;
  return { analysis: { provider: "ollama", model: ollama.analysisModel }, creation: { provider: "ollama", model: ollama.creationModel } };
}

function selectionFromLegacy(providerName: "configured" | "mock", currentProvider: AiProvider, role: "analysis" | "creation"): ProviderSelection {
  if (providerName === "mock") return mockSelection;
  return configuredSelections(currentProvider)[role];
}

function providerForSelection(selection: ProviderSelection, role: "analysis" | "creation", currentProvider: AiProvider): AiProvider {
  if (selection.provider === "mock") return new MockAiProvider(true);
  if (selection.provider !== "ollama") throw new Error("Embedding models can only be used through the embedding evaluation action.");
  const baseUrl = currentProvider instanceof OllamaAiProvider ? currentProvider.baseUrl : undefined;
  const configured = configuredSelections(currentProvider);
  const analysisModel = role === "analysis" ? selection.model : configured.analysis.model;
  const creationModel = role === "creation" ? selection.model : configured.creation.model;
  return new OllamaAiProvider(baseUrl, analysisModel, creationModel);
}

function invalidMockSelection(selection: ProviderSelection): boolean {
  return selection.provider === "mock" && Boolean(selection.model) && selection.model !== mockSelection.model;
}

function invalidGenerationSelection(selection: ProviderSelection): boolean {
  return selection.provider === "openrouter";
}

export function buildApp(repository = new VaultRepository(process.env.VAULT_DATABASE_PATH ?? "apps/api/data/vault.db"), provider: AiProvider = createConfiguredProvider(), options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: true });
  const companionSecurity = options.companionSecurity;
  void app.register(cors, companionSecurity ? {
    origin: companionSecurity.allowedOrigin,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["authorization", "content-type", "accept"],
    credentials: false
  } : { origin: true });
  if (companionSecurity) {
    app.addHook("onRequest", async (request, reply) => {
      if (!request.url.startsWith("/api/")) return;
      const origin = request.headers.origin;
      if (origin !== companionSecurity.allowedOrigin) return reply.code(403).send({ error: "Forbidden origin" });
      if (request.method === "OPTIONS") {
        reply.header("Access-Control-Allow-Private-Network", "true");
        return;
      }
      if (Date.now() >= companionSecurity.expiresAt) return reply.code(401).send({ error: "Pairing session expired" });
      if (!hasValidBearerToken(request.headers.authorization, companionSecurity.token)) return reply.code(401).send({ error: "Unauthorized" });
    });
  }
  const executionService = new ExecutionService(repository, provider);
  const architectureOrchestrator = new ArchitectureOrchestrator();
  const architectureAnalyzer = new ArchitectureAnalyzer(architectureOrchestrator.registry);
  const openRouterEmbeddings = new OpenRouterEmbeddingProvider();

  async function unavailableCreationSelection(selection: ProviderSelection): Promise<string | undefined> {
    if (invalidMockSelection(selection)) return "The selected mock model is not available in the current provider catalog.";
    if (invalidGenerationSelection(selection)) return "Embedding models are only available through the embedding evaluation action.";
    if (selection.provider !== "ollama") return undefined;
    const ollama = provider instanceof OllamaAiProvider ? provider : new OllamaAiProvider();
    const inventory = await ollama.listModels();
    if (!selection.model || isRemovedOllamaModel(selection.model) || !inventory.models.includes(selection.model)) return "The selected creation model is not available in the current Ollama catalog.";
    return undefined;
  }

  async function generateCoreDocument(blueprintId: string, prdExecution: ExecutionRecord, filename: CoreDocumentFilename, selection: ProviderSelection): Promise<ExecutionRecord> {
    const prepared = prepareCoreDocument(blueprintId, prdExecution, filename, selection);
    return prepared.selectedProvider === provider ? executionService.execute(prepared.artifact) : new ExecutionService(repository, prepared.selectedProvider).execute(prepared.artifact);
  }

  function prepareCoreDocument(blueprintId: string, prdExecution: ExecutionRecord, filename: CoreDocumentFilename, selection: ProviderSelection) {
    const artifact = repository.createPromptArtifact(blueprintId, generateCoreDocumentPrompt(prdExecution.generatedOutput, filename), { kind: "core-document", documentFilename: filename, sourceExecutionId: prdExecution.id });
    const selectedProvider = providerForSelection(selection, "creation", provider);
    return { artifact, selectedProvider };
  }

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    const statusCode = typeof error === "object" && error !== null && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500;
    const message = typeof error === "object" && error !== null && "message" in error && typeof error.message === "string" ? error.message : "Unexpected server error";
    return reply.code(statusCode < 500 ? statusCode : 500).send({ error: "Request failed", message: statusCode < 500 ? message : "Unexpected server error" });
  });

  app.post("/api/blueprints", async (request, reply) => {
    const parsed = blueprintInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid blueprint", issues: parsed.error.flatten() });
    return reply.code(201).send(repository.createBlueprint(parsed.data));
  });

  app.get("/api/blueprints", async () => repository.listBlueprints());

  app.get("/api/providers/status", async () => {
    const health = await provider.health();
    return providerStatusSchema.parse({ configured: { name: provider.name, model: health.model }, models: health.models, available: health.available, detail: health.detail, fallbackAvailable: provider.name !== "mock" });
  });

  app.get("/api/providers/models", async () => {
    const configured = configuredSelections(provider);
    const ollama = provider instanceof OllamaAiProvider ? provider : new OllamaAiProvider();
    const catalog = await ollama.catalog(configured);
    return { ...catalog, embeddingModels: [openRouterEmbeddings.catalogOption()] };
  });

  app.get("/api/connection-info", async () => ({
    contractVersion: 1,
    authentication: companionSecurity ? "bearer-required" : "optional",
    providers: { localOnly: Boolean(companionSecurity), embeddingAvailable: !companionSecurity && Boolean(process.env.OPENROUTER_API_KEY) }
  }));

  app.post("/api/providers/embeddings/test", async (request, reply) => {
    const parsed = embeddingProbeSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid embedding test request", issues: parsed.error.flatten() });
    try {
      return await openRouterEmbeddings.embed(parsed.data);
    } catch (error) {
      return reply.code(502).send({ error: "Embedding request failed", message: error instanceof Error ? error.message : "The embedding provider returned an unknown error." });
    }
  });

  app.post("/api/architecture-discovery", async (request, reply) => {
    const parsed = discoveryInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid discovery brief", issues: parsed.error.flatten() });
    const selection = parsed.data.analysis ?? selectionFromLegacy(parsed.data.provider, provider, "analysis");
    if (invalidMockSelection(selection)) return reply.code(400).send({ error: "Unavailable provider model", message: "The selected mock model is not available in the current provider catalog." });
    if (invalidGenerationSelection(selection)) return reply.code(400).send({ error: "Unsupported generation model", message: "Embedding models are only available through the embedding evaluation action." });
    if (selection.provider === "ollama") {
      const ollama = provider instanceof OllamaAiProvider ? provider : new OllamaAiProvider();
      const inventory = await ollama.listModels();
      if (!selection.model || isRemovedOllamaModel(selection.model) || !inventory.models.includes(selection.model)) {
        return reply.code(400).send({ error: "Unavailable provider model", message: "The selected analysis model is not available in the current Ollama catalog." });
      }
    }
    try {
      const selectedProvider = providerForSelection(selection, "analysis", provider);
      const result = await architectureAnalyzer.analyze(parsed.data.brief, selectedProvider);
      // Discovery review is an expected consultative result, not a failed HTTP request.
      // Final synthesis keeps the 422 gate when authorization cannot pass.
      if (result.status === "review-required") return reply.code(200).send({ ...result, availableGenerators: architectureOrchestrator.registry.listCapabilities() });
      return reply.code(200).send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to analyze architecture direction";
      return reply.code(503).send({ error: "Architecture discovery failed", message });
    }
  });

  app.post("/api/blueprint-proposals", async (request, reply) => {
    const parsed = briefInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid brief", issues: parsed.error.flatten() });
    let discovery;
    if (parsed.data.discovery !== undefined) {
      const discoveryResult = discoveryResultSchema.safeParse(parsed.data.discovery);
      if (!discoveryResult.success) return reply.code(400).send({ error: "Invalid discovery handoff", issues: discoveryResult.error.flatten() });
      discovery = discoveryResult.data;
    }
    const preparation = architectureOrchestrator.prepare(parsed.data.brief, parsed.data.generatorId, discovery);
    if (preparation.status !== "ready") return reply.code(422).send({ status: "review-required", classification: preparation.classification, constraints: preparation.constraints, reasons: preparation.reasons, questions: preparation.questions, registryValidation: preparation.registryValidation, availableGenerators: architectureOrchestrator.registry.listCapabilities() });
    const selection = parsed.data.analysis ?? selectionFromLegacy(parsed.data.provider, provider, "analysis");
    if (invalidMockSelection(selection)) return reply.code(400).send({ error: "Unavailable provider model", message: "The selected mock model is not available in the current provider catalog." });
    if (invalidGenerationSelection(selection)) return reply.code(400).send({ error: "Unsupported generation model", message: "Embedding models are only available through the embedding evaluation action." });
    if (selection.provider === "ollama") {
      const ollama = provider instanceof OllamaAiProvider ? provider : new OllamaAiProvider();
      const inventory = await ollama.listModels();
       if (!selection.model || isRemovedOllamaModel(selection.model) || !inventory.models.includes(selection.model)) {
        return reply.code(400).send({ error: "Unavailable provider model", message: "The selected analysis model is not available in the current Ollama catalog." });
      }
    }
    const selectedProvider = providerForSelection(selection, "analysis", provider);
    try {
      const result = await selectedProvider.generateBlueprint(architectureOrchestrator.buildAuthorizedProviderRequest(preparation));
      const handoff = { registryVersion: preparation.authorization.registryVersion, discoveryUsed: preparation.authorization.discoveryUsed, selectedFromDiscovery: discovery?.likelyStackOptions.some((option) => option.stackId === preparation.generator.stackId) ? preparation.generator.stackId : null, confirmedByUser: true };
      const packet = architectureOrchestrator.createPacket(preparation.generator, parsed.data.brief, result.proposal.blueprint, preparation.classification, handoff, preparation.authorization);
      const validation = validationReportSchema.parse(architectureOrchestrator.validateAuthorizedPacket(preparation, packet));
      if (validation.status !== "passed") return reply.code(422).send({ status: "validation-failed", classification: preparation.classification, validation });
      const proposal = blueprintProposalSchema.parse({
        ...result.proposal,
        blueprint: { ...result.proposal.blueprint, implementationPlan: result.proposal.plan, architecturePacket: packet, source: selectedProvider.name === "ollama" ? "ollama" : "mock", sourceBrief: parsed.data.brief },
        provider: result.metadata,
        classification: preparation.classification,
        architecturePacket: packet,
        packet,
        validation,
        status: "validated",
        provenance: { ...handoff, ...preparation.authorization }
      });
      return reply.code(201).send(proposal);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to generate blueprint proposal";
      return reply.code(503).send({ error: "Blueprint proposal failed", message, fallbackAvailable: selectedProvider.name !== "mock" });
    }
  });

  app.get<{ Params: { id: string } }>("/api/blueprints/:id", async (request, reply) => {
    const blueprint = repository.getBlueprint(request.params.id);
    if (!blueprint) return reply.code(404).send({ error: "Blueprint not found" });
    return blueprint;
  });

  app.get<{ Params: { id: string } }>("/api/blueprints/:id/prompt", async (request, reply) => {
    if (!repository.getBlueprint(request.params.id)) return reply.code(404).send({ error: "Blueprint not found" });
    const promptArtifact = repository.getLatestPromptArtifact(request.params.id, "prd") ?? repository.getLatestPromptArtifact(request.params.id);
    if (!promptArtifact) return reply.code(404).send({ error: "Prompt artifact not found" });
    return promptArtifact;
  });

  app.get<{ Params: { id: string } }>("/api/blueprints/:id/executions", async (request, reply) => {
    if (!repository.getBlueprint(request.params.id)) return reply.code(404).send({ error: "Blueprint not found" });
    return repository.listExecutionRecords(request.params.id);
  });

  app.get<{ Params: { id: string } }>("/api/executions/:id", async (request, reply) => {
    const execution = repository.getExecutionRecord(request.params.id);
    if (!execution) return reply.code(404).send({ error: "Execution record not found" });
    const prompt = repository.getPromptArtifact(execution.promptArtifactId);
    return { ...execution, prompt: prompt?.generatedPrompt ?? execution.inputPrompt, evidence: { verificationNotes: execution.verificationNotes } };
  });

  app.post("/api/executions", async (request, reply) => {
    const parsed = executionCreateSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid execution request", issues: parsed.error.flatten() });
    const promptArtifact = repository.getPromptArtifact(parsed.data.promptArtifactId);
    if (!promptArtifact) return reply.code(404).send({ error: "Prompt artifact not found" });
    const selection = parsed.data.creation ?? selectionFromLegacy(parsed.data.provider, provider, "creation");
    if (invalidMockSelection(selection)) return reply.code(400).send({ error: "Unavailable provider model", message: "The selected mock model is not available in the current provider catalog." });
    if (invalidGenerationSelection(selection)) return reply.code(400).send({ error: "Unsupported generation model", message: "Embedding models are only available through the embedding evaluation action." });
    if (selection.provider === "ollama") {
      const ollama = provider instanceof OllamaAiProvider ? provider : new OllamaAiProvider();
      const inventory = await ollama.listModels();
      if (!selection.model || !inventory.models.includes(selection.model)) {
        return reply.code(400).send({ error: "Unavailable provider model", message: "The selected creation model is not available in the current Ollama catalog." });
      }
    }
    const selectedProvider = providerForSelection(selection, "creation", provider);
    const execution = selectedProvider === provider ? await executionService.execute(promptArtifact) : await new ExecutionService(repository, selectedProvider).execute(promptArtifact);
    return reply.code(201).send({ ...execution, prompt: promptArtifact.generatedPrompt, evidence: { verificationNotes: execution.verificationNotes } });
  });

  app.get<{ Params: { id: string } }>("/api/blueprints/:id/workspace", async (request, reply) => {
    const blueprint = repository.getBlueprint(request.params.id);
    if (!blueprint) return reply.code(404).send({ error: "Blueprint not found" });
    return workspaceFromRecords(blueprint, repository.listExecutionRecords(blueprint.id));
  });

  app.get<{ Params: { id: string }; Querystring: { filename?: string; provider?: string; model?: string } }>("/api/blueprints/:id/generate/stream", async (request, reply) => {
    const filename = request.query.filename;
    if (!filename || !coreDocumentFilenames.includes(filename as CoreDocumentFilename)) {
      return reply.code(400).send({ error: "A valid core-document filename is required" });
    }
    if (request.query.provider && request.query.provider !== "mock" && request.query.provider !== "ollama") {
      return reply.code(400).send({ error: "Invalid provider selection" });
    }
    const blueprint = repository.getBlueprint(request.params.id);
    if (!blueprint) return reply.code(404).send({ error: "Blueprint not found" });
    const records = repository.listExecutionRecords(blueprint.id);
    const prdExecution = records.find((record) => record.artifactType === "PRD" && record.status === "completed");
    if (!prdExecution) return reply.code(400).send({ error: "No completed PRD generation found. Please generate the PRD first." });

    const selection: ProviderSelection = request.query.provider === "mock"
      ? { provider: "mock", model: request.query.model ?? mockSelection.model }
      : request.query.provider === "ollama"
        ? { provider: "ollama", model: request.query.model }
        : configuredSelections(provider).creation;
    const unavailable = await unavailableCreationSelection(selection);
    if (unavailable) return reply.code(400).send({ error: "Unavailable provider model", message: unavailable });

    const prepared = prepareCoreDocument(blueprint.id, prdExecution, filename as CoreDocumentFilename, selection);
    const controller = new AbortController();
    let closed = false;
    const onClose = () => { closed = true; controller.abort(); };
    request.raw.once("close", onClose);

    reply.hijack();
    const requestOrigin = request.headers.origin;
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": requestOrigin ?? "*",
      "Vary": "Origin"
    });
    const send = (payload: Record<string, unknown>) => {
      if (!closed && !reply.raw.destroyed) reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      const execution = await new ExecutionService(repository, prepared.selectedProvider).stream(prepared.artifact, (chunk) => send({ chunk }), controller.signal);
      if (!closed) send(execution.status === "completed" ? { status: "DONE" } : { status: "ERROR", message: execution.verificationNotes || "Document generation failed" });
    } catch (error) {
      if (!closed) send({ status: "ERROR", message: error instanceof Error ? error.message : "Document generation failed" });
    } finally {
      request.raw.off("close", onClose);
      if (!reply.raw.destroyed) reply.raw.end();
    }
    return reply;
  });

  app.post<{ Params: { id: string } }>("/api/executions/:id/verify", async (request, reply) => {
    const parsed = verificationInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid verification note", issues: parsed.error.flatten() });
    const execution = repository.addVerificationNotes(request.params.id, parsed.data.verificationNotes);
    if (!execution) return reply.code(404).send({ error: "Execution record not found" });
    return { ...execution, prompt: repository.getPromptArtifact(execution.promptArtifactId)?.generatedPrompt ?? execution.inputPrompt, evidence: { verificationNotes: execution.verificationNotes } };
  });

  app.post<{ Params: { id: string }; Body: { creation?: ProviderSelection } }>("/api/blueprints/:id/generate-core-docs", async (request, reply) => {
    const parsed = generateCoreDocsInputSchema.safeParse(request.body ?? {});
    if (!parsed.success) return reply.code(400).send({ error: "Invalid core-document request", issues: parsed.error.flatten() });
    const blueprint = repository.getBlueprint(request.params.id);
    if (!blueprint) return reply.code(404).send({ error: "Blueprint not found" });

    const executions = repository.listExecutionRecords(blueprint.id);
    const prdExecution = executions.find((e) => e.status === "completed" && e.artifactType === "PRD");
    if (!prdExecution) {
      return reply.code(400).send({ error: "No completed PRD generation found. Please generate the PRD first." });
    }

    const selection = parsed.data.creation ?? selectionFromLegacy("configured", provider, "creation");
    const unavailable = await unavailableCreationSelection(selection);
    if (unavailable) return reply.code(400).send({ error: "Unavailable provider model", message: unavailable });
    const requestedFiles = parsed.data.requestedFiles ?? coreDocumentFilenames;
    const generated = [];
    for (const filename of requestedFiles) generated.push(await generateCoreDocument(blueprint.id, prdExecution, filename, selection));
    return reply.code(201).send({ workspace: workspaceFromRecords(blueprint, repository.listExecutionRecords(blueprint.id)), executions: generated });
  });

  app.post<{ Params: { id: string } }>("/api/blueprints/:id/reroll-doc", async (request, reply) => {
    const parsed = rerollDocumentInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid document reroll request", issues: parsed.error.flatten() });
    const blueprint = repository.getBlueprint(request.params.id);
    if (!blueprint) return reply.code(404).send({ error: "Blueprint not found" });
    const records = repository.listExecutionRecords(blueprint.id);
    const prdExecution = records.find((record) => record.artifactType === "PRD" && record.status === "completed");
    if (!prdExecution) return reply.code(400).send({ error: "No completed PRD generation found. Please generate the PRD first." });
    const selection = parsed.data.creation ?? selectionFromLegacy("configured", provider, "creation");
    const unavailable = await unavailableCreationSelection(selection);
    if (unavailable) return reply.code(400).send({ error: "Unavailable provider model", message: unavailable });
    const execution = await generateCoreDocument(blueprint.id, prdExecution, parsed.data.filename, selection);
    return reply.code(201).send({ execution, workspace: workspaceFromRecords(blueprint, repository.listExecutionRecords(blueprint.id)) });
  });

  app.post<{ Body: { description: string; model?: string } }>("/api/blueprints/extrapolate", async (request, reply) => {
    const { description, model: requestedModel } = request.body;
    if (!description || !description.trim()) {
      return reply.code(400).send({ error: "Missing description" });
    }

    const systemPrompt = [
      "You are a structured project architect.",
      "Analyze the project description provided and extrapolate the project details into a JSON payload.",
      "Your response must be a single, valid JSON object matching this schema exactly:",
      "{",
      '  "projectName": "String (Short, punchy app name)",',
      '  "architectureOverview": "String (Extrapolated project scope & core goals)",',
      '  "coreLogic": "String (Identified target audience and primary use case)",',
      '  "dependencies": ["Array", "of", "inferred", "packages"],',
      '  "technicalConstraints": ["Array", "of", "standard", "architectural", "constraints"],',
      '  "comments": ["Array", "of", "extra", "context", "or", "UI", "suggestions"]',
      "}",
      "Do not output markdown code blocks or any text outside of the raw JSON object."
    ].join("\n");

    if (provider.name !== "mock" && (!requestedModel || isRemovedOllamaModel(requestedModel))) {
      return reply.code(400).send({ error: "An Ollama model must be selected before extrapolation." });
    }
    const selection: ProviderSelection = provider.name === "mock"
      ? { provider: "mock", model: "deterministic-local" }
      : { provider: "ollama", model: requestedModel };

    const selectedProvider = providerForSelection(selection, "analysis", provider);
    const fullPrompt = `${systemPrompt}\n\n## Project Description:\n${description}`;
    const result = await selectedProvider.generate({ prompt: fullPrompt, executionId: "extrapolate" });

    let parsed: any;
    try {
      const cleanText = result.output.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleanText);
    } catch {
      parsed = {
        projectName: "Extrapolated Project",
        architectureOverview: "Error parsing LLM response. Please review the description.",
        coreLogic: "Error parsing LLM response.",
        dependencies: [],
        technicalConstraints: [],
        comments: []
      };
    }

    return reply.code(200).send(parsed);
  });

  app.post<{ Params: { id: string } }>("/api/blueprints/:id/generate-prompt", async (request, reply) => {
    const blueprint = repository.getBlueprint(request.params.id);
    if (!blueprint) return reply.code(404).send({ error: "Blueprint not found" });
    const artifact = repository.createPromptArtifact(blueprint.id, generateCodexPrompt(blueprint), { kind: "prd", documentFilename: "PRD.md", contextSummary: generateContextSummary(blueprint) });
    const execution = repository.createExecutionRecord(blueprint.id, artifact.id, artifact.generatedPrompt);
    return reply.code(201).send({ blueprint, promptArtifact: artifact, executionRecord: execution });
  });

  app.patch<{ Params: { id: string }; Body: { projectName?: string; tags?: string[] } }>("/api/blueprints/:id", async (request, reply) => {
    const blueprint = repository.getBlueprint(request.params.id);
    if (!blueprint) return reply.code(404).send({ error: "Blueprint not found" });
    const parsed = blueprintMutationSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid blueprint update", issues: parsed.error.flatten() });
    const { projectName, tags } = parsed.data;
    const updatedInput = {
      ...blueprint,
      name: projectName !== undefined ? projectName : blueprint.name,
      tags: tags !== undefined ? tags : blueprint.tags
    };
    const updated = repository.updateBlueprint(blueprint.id, updatedInput);
    return reply.code(200).send(updated);
  });

  app.delete<{ Params: { id: string } }>("/api/blueprints/:id", async (request, reply) => {
    const deleted = repository.deleteBlueprint(request.params.id);
    if (!deleted) return reply.code(404).send({ error: "Blueprint not found" });
    return reply.code(200).send({ success: true });
  });

  app.post<{ Body: { ids: string[] } }>("/api/blueprints/bulk-delete", async (request, reply) => {
    const { ids } = request.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return reply.code(400).send({ error: "Invalid array of IDs" });
    }
    const count = repository.bulkDeleteBlueprints(ids);
    return reply.code(200).send({ success: true, count });
  });

  app.post<{ Params: { id: string }; Body: { targetPath: string; files: { filename: string; content: string }[] } }>("/api/blueprints/:id/sync-to-disk", async (request, reply) => {
    const blueprint = repository.getBlueprint(request.params.id);
    if (!blueprint) return reply.code(404).send({ error: "Blueprint not found" });

    const { targetPath, files } = request.body;
    if (!targetPath || !Array.isArray(files)) {
      return reply.code(400).send({ error: "Invalid targetPath or files list" });
    }

    const fs = await import("node:fs/promises");
    const path = await import("node:path");

    try {
      await fs.mkdir(targetPath, { recursive: true });
      const writtenPaths: string[] = [];

      for (const file of files) {
        const fullPath = path.resolve(targetPath, file.filename);
        const relative = path.relative(targetPath, fullPath);
        if (relative.startsWith("..") || path.isAbsolute(relative)) {
          return reply.code(400).send({ error: `Path traversal detected: ${file.filename}` });
        }
        await fs.writeFile(fullPath, file.content, "utf8");
        writtenPaths.push(fullPath);
      }

      return reply.code(200).send({ success: true, writtenPaths });
    } catch (err) {
      return reply.code(500).send({ error: err instanceof Error ? err.message : "Disk sync failed" });
    }
  });

  app.addHook("onClose", async () => repository.close());
  return app;
}
