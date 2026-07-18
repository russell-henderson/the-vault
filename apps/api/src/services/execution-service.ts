import type { ExecutionRecord, PromptArtifact } from "@the-vault/shared";
import { VaultRepository } from "../repository.js";
import type { AiProvider } from "../providers/types.js";

export class ExecutionService {
  constructor(private readonly repository: VaultRepository, private readonly provider: AiProvider) {}

  async stream(promptArtifact: PromptArtifact, onChunk: (chunk: string) => void | Promise<void>, signal?: AbortSignal): Promise<ExecutionRecord> {
    const execution = this.repository.createExecutionRecord(promptArtifact.blueprintId, promptArtifact.id, promptArtifact.generatedPrompt, { documentFilename: promptArtifact.documentFilename, sourceExecutionId: promptArtifact.sourceExecutionId });
    const started = Date.now();
    try {
      const validation = await this.provider.validate(promptArtifact.generatedPrompt);
      if (!validation.valid) throw new Error(`Provider rejected prompt: ${validation.issues.join(", ")}`);
      this.repository.markExecutionRunning(execution.id);
      let output = "";
      for await (const chunk of this.provider.stream({ prompt: promptArtifact.generatedPrompt, executionId: execution.id, signal })) {
        if (signal?.aborted) throw new Error("Generation cancelled by client");
        output += chunk;
        await onChunk(chunk);
      }
      if (signal?.aborted) throw new Error("Generation cancelled by client");
      const artifact = this.artifactFor(promptArtifact, execution.id);
      return this.repository.completeExecution(execution.id, output, artifact.artifactType, artifact.artifactLocation, new Date().toISOString(), { name: this.provider.name, model: this.provider.model, durationMs: Date.now() - started }, { documentFilename: promptArtifact.documentFilename, sourceExecutionId: promptArtifact.sourceExecutionId }) ?? execution;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown provider failure";
      return this.repository.failExecution(execution.id, message) ?? { ...execution, status: "failed", verificationNotes: message };
    }
  }

  async execute(promptArtifact: PromptArtifact): Promise<ExecutionRecord> {
    const execution = this.repository.createExecutionRecord(promptArtifact.blueprintId, promptArtifact.id, promptArtifact.generatedPrompt, { documentFilename: promptArtifact.documentFilename, sourceExecutionId: promptArtifact.sourceExecutionId });
    try {
      const validation = await this.provider.validate(promptArtifact.generatedPrompt);
      if (!validation.valid) throw new Error(`Provider rejected prompt: ${validation.issues.join(", ")}`);
      this.repository.markExecutionRunning(execution.id);
      const result = await this.provider.generate({ prompt: promptArtifact.generatedPrompt, executionId: execution.id });
      const artifact = this.artifactFor(promptArtifact, execution.id, result.artifactType, result.artifactLocation);
      return this.repository.completeExecution(execution.id, result.output, artifact.artifactType, artifact.artifactLocation, new Date().toISOString(), result.metadata, { documentFilename: promptArtifact.documentFilename, sourceExecutionId: promptArtifact.sourceExecutionId }) ?? execution;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown provider failure";
      return this.repository.failExecution(execution.id, message) ?? { ...execution, status: "failed", verificationNotes: message };
    }
  }

  private artifactFor(promptArtifact: PromptArtifact, executionId: string, defaultType = "", defaultLocation?: string): { artifactType: string; artifactLocation: string } {
    let artifactType = defaultType;
    let artifactLocation = defaultLocation ?? `memory://executions/${executionId}`;
    if (promptArtifact.kind === "prd" || promptArtifact.generatedPrompt.includes("Your task is to generate a comprehensive, professional Product Requirement Document")) {
      artifactType = "PRD";
      artifactLocation = "docs/PRD.md";
    } else if (promptArtifact.kind === "core-document" || promptArtifact.generatedPrompt.includes("## PRD Source Text")) {
      artifactType = "Core Documentation";
      artifactLocation = promptArtifact.documentFilename ? `docs/${promptArtifact.documentFilename}` : "docs/CoreDocs.md";
    }
    return { artifactType, artifactLocation };
  }
}
