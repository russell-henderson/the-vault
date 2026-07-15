import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { generateCodexPrompt } from "@the-vault/prompts";
import { blueprintInputSchema } from "@the-vault/shared";
import { VaultRepository } from "./repository.js";

export function buildApp(repository = new VaultRepository()): FastifyInstance {
  const app = Fastify({ logger: true });
  void app.register(cors, { origin: true });

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

  app.post<{ Params: { id: string } }>("/api/blueprints/:id/generate-prompt", async (request, reply) => {
    const blueprint = repository.getBlueprint(request.params.id);
    if (!blueprint) return reply.code(404).send({ error: "Blueprint not found" });
    const artifact = repository.createPromptArtifact(blueprint.id, generateCodexPrompt(blueprint));
    const execution = repository.createExecutionRecord(blueprint.id, artifact.id);
    return reply.code(201).send({ blueprint, promptArtifact: artifact, executionRecord: execution });
  });

  app.addHook("onClose", async () => repository.close());
  return app;
}
