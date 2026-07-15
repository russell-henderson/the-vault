import type { AiGenerateRequest, AiGenerateResult, AiProvider } from "./types.js";

export class MockAiProvider implements AiProvider {
  readonly name = "mock";

  async validate(prompt: string) {
    return { valid: prompt.trim().length > 0 && !prompt.includes("[INVALID_PROMPT]"), issues: prompt.trim().length > 0 && !prompt.includes("[INVALID_PROMPT]") ? [] : ["Prompt is empty or marked invalid"] };
  }

  async generate(request: AiGenerateRequest): Promise<AiGenerateResult> {
    if (request.prompt.includes("[MOCK_PROVIDER_FAILURE]")) throw new Error("Mock provider failure requested");
    return { artifactType: "implementation-plan", artifactLocation: `mock://executions/${request.executionId}`, output: ["# Mock Codex Result", "", "This output was produced by the local provider abstraction.", "", "## Source prompt", `The provider received ${request.prompt.length} characters.`, "", "## Proposed artifact", "- Preserve the requested architecture and constraints.", "- Keep implementation scope bounded.", "- Verify the result against the blueprint acceptance criteria."].join("\n") };
  }

  async *stream(request: AiGenerateRequest): AsyncIterable<string> {
    const result = await this.generate(request);
    yield result.output;
  }
}
