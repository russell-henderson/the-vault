import type { AiGenerateRequest, AiGenerateResult, AiProvider, BlueprintGenerateRequest, BlueprintGenerateResult } from "./types.js";

export class MockAiProvider implements AiProvider {
  readonly name = "mock";

  constructor(private readonly explicitFallback = true) {}

  async validate(prompt: string) {
    return { valid: prompt.trim().length > 0 && !prompt.includes("[INVALID_PROMPT]"), issues: prompt.trim().length > 0 && !prompt.includes("[INVALID_PROMPT]") ? [] : ["Prompt is empty or marked invalid"] };
  }

  async generate(request: AiGenerateRequest): Promise<AiGenerateResult> {
    if (request.prompt.includes("[MOCK_PROVIDER_FAILURE]")) throw new Error("Mock provider failure requested");
    return { artifactType: "implementation-plan", artifactLocation: `mock://executions/${request.executionId}`, metadata: { name: this.name, model: "deterministic-local", fallback: this.explicitFallback, message: this.explicitFallback ? "Explicit deterministic mock fallback" : "Configured deterministic mock provider", durationMs: 4 }, output: ["# Mock Codex Result", "", "This output was produced by the local provider abstraction.", "", "## Source prompt", `The provider received ${request.prompt.length} characters.`, "", "## Proposed artifact", "- Preserve the requested architecture and constraints.", "- Keep implementation scope bounded.", "- Verify the result against the blueprint acceptance criteria."].join("\n") };
  }

  async *stream(request: AiGenerateRequest): AsyncIterable<string> {
    const result = await this.generate(request);
    yield result.output;
  }

  async generateBlueprint(request: BlueprintGenerateRequest): Promise<BlueprintGenerateResult> {
    const brief = request.brief.trim();
    return {
      metadata: { name: this.name, model: "deterministic-local", fallback: this.explicitFallback, message: this.explicitFallback ? "Generated from the explicit mock fallback" : "Generated from the configured deterministic provider", durationMs: 5 },
      proposal: {
        blueprint: {
          name: "Brief-driven analytics panel",
          description: brief,
          targetPath: "src/components/AnalyticsPanel.tsx",
          language: "TypeScript",
          framework: "React + Tailwind",
          dependencies: ["analytics-api", "shared-ui"],
          architectureOverview: "A presentational dashboard panel that consumes analytics data through a typed API boundary and keeps server persistence outside the component.",
          coreLogic: "Render loading, error, empty, and ready states. Keep filtering and display transformations local while delegating data fetching to the analytics API adapter.",
          layoutDesign: "Responsive card layout with a compact summary row, accessible controls, keyboard navigation, and a clear data visualization area.",
          constraints: ["Do not own server persistence.", "Keep provider and API concerns outside the presentational component.", "Support keyboard navigation and responsive layouts."],
          implementationPlan: undefined,
          source: "mock",
          sourceBrief: brief
        },
        plan: {
          summary: "Create a bounded, accessible analytics panel with a typed data boundary and explicit UI states.",
          steps: ["Define the analytics view model and API adapter contract.", "Build the panel shell with loading, error, empty, and ready states.", "Add responsive layout, keyboard behavior, and acceptance checks."],
          filesToTouch: ["src/components/AnalyticsPanel.tsx", "src/api/analytics.ts", "tests/AnalyticsPanel.test.tsx"],
          assumptions: ["The existing application owns API persistence.", "Analytics data is available through a typed client method."],
          acceptanceCriteria: ["The component renders every required data state.", "No server persistence is introduced in the component.", "Keyboard navigation and responsive behavior are verified."]
        },
        warnings: ["This is a deterministic mock proposal. Review all assumptions before approval."],
        provider: { name: this.name, model: "deterministic-local", fallback: this.explicitFallback, message: this.explicitFallback ? "Generated from the explicit mock fallback" : "Generated from the configured deterministic provider", durationMs: 5 }
      }
    };
  }

  async health() { return { available: true, detail: "Deterministic mock is ready", model: "deterministic-local", models: { analysis: "deterministic-local", creation: "deterministic-local" } }; }
}
