import type { ExecutionRecord, PromptArtifact } from "@the-vault/shared";
import { VaultRepository } from "../repository.js";
import type { AiProvider } from "../providers/types.js";

export class ExecutionService {
  constructor(private readonly repository: VaultRepository, private readonly provider: AiProvider) {}

  async execute(promptArtifact: PromptArtifact): Promise<ExecutionRecord> {
    const execution = this.repository.createExecutionRecord(promptArtifact.blueprintId, promptArtifact.id, promptArtifact.generatedPrompt);
    try {
      const validation = await this.provider.validate(promptArtifact.generatedPrompt);
      if (!validation.valid) throw new Error(`Provider rejected prompt: ${validation.issues.join(", ")}`);
      this.repository.markExecutionRunning(execution.id);
      const result = await this.provider.generate({ prompt: promptArtifact.generatedPrompt, executionId: execution.id });
      return this.repository.completeExecution(execution.id, result.output, result.artifactType, result.artifactLocation ?? `memory://executions/${execution.id}`, new Date().toISOString(), result.metadata) ?? execution;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown provider failure";
      return this.repository.failExecution(execution.id, message) ?? { ...execution, status: "failed", verificationNotes: message };
    }
  }
}
