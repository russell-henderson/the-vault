import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { generateCodexPrompt } from "@the-vault/prompts";
import { blueprintInputSchema, executionCreateSchema, verificationInputSchema } from "@the-vault/shared";
import { VaultRepository } from "./repository.js";
import { MockAiProvider } from "./providers/mock-provider.js";
import type { AiProvider } from "./providers/types.js";
import { ExecutionService } from "./services/execution-service.js";

export function buildApp(repository = new VaultRepository(), provider: AiProvider = new MockAiProvider()): FastifyInstance {
  const app = Fastify({ logger: true });
  void app.register(cors, { origin: true });
  const executionService = new ExecutionService(repository, provider);

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

  app.get<{ Params: { id: string } }>("/api/blueprints/:id", async (request, reply) => {
    const blueprint = repository.getBlueprint(request.params.id);
    if (!blueprint) return reply.code(404).send({ error: "Blueprint not found" });
    return blueprint;
  });

  app.get<{ Params: { id: string } }>("/api/blueprints/:id/prompt", async (request, reply) => {
    if (!repository.getBlueprint(request.params.id)) return reply.code(404).send({ error: "Blueprint not found" });
    const promptArtifact = repository.getLatestPromptArtifact(request.params.id);
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
    const execution = await executionService.execute(promptArtifact);
    return reply.code(201).send({ ...execution, prompt: promptArtifact.generatedPrompt, evidence: { verificationNotes: execution.verificationNotes } });
  });

  app.post<{ Params: { id: string } }>("/api/executions/:id/verify", async (request, reply) => {
    const parsed = verificationInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid verification note", issues: parsed.error.flatten() });
    const execution = repository.addVerificationNotes(request.params.id, parsed.data.verificationNotes);
    if (!execution) return reply.code(404).send({ error: "Execution record not found" });
    return { ...execution, prompt: repository.getPromptArtifact(execution.promptArtifactId)?.generatedPrompt ?? execution.inputPrompt, evidence: { verificationNotes: execution.verificationNotes } };
  });

  app.post<{ Params: { id: string } }>("/api/blueprints/:id/generate-prompt", async (request, reply) => {
    const blueprint = repository.getBlueprint(request.params.id);
    if (!blueprint) return reply.code(404).send({ error: "Blueprint not found" });
    const artifact = repository.createPromptArtifact(blueprint.id, generateCodexPrompt(blueprint));
    const execution = repository.createExecutionRecord(blueprint.id, artifact.id, artifact.generatedPrompt);
    return reply.code(201).send({ blueprint, promptArtifact: artifact, executionRecord: execution });
  });

  app.addHook("onClose", async () => repository.close());
  return app;
}
