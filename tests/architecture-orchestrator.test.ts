import { describe, expect, it } from "vitest";
import { ArchitectureOrchestrator } from "../apps/api/src/services/architecture-orchestrator.js";

describe("architecture constraint gate", () => {
  const orchestrator = new ArchitectureOrchestrator();

  it("routes a supported non-web brief to its native generator", () => {
    const preparation = orchestrator.prepare("Build a Swift SpriteKit iOS physics game with collision handling. No web.");

    expect(preparation.status).toBe("ready");
    if (preparation.status !== "ready") throw new Error("Expected a ready preparation");
    expect(preparation.generator.stackId).toBe("swift-spritekit");
    expect(preparation.constraints.platforms).toEqual(["mobile"]);
    expect(preparation.constraints.languages).toEqual(["swift"]);
    expect(preparation.constraints.prohibitions).toContain("web");
    expect(orchestrator.buildSynthesisRequest("Swift SpriteKit iOS game", preparation).instruction).toContain("hard, non-overridable requirements");
  });

  it("does not substitute SpriteKit or React for an unsupported SwiftUI request", () => {
    const preparation = orchestrator.prepare("Build a SwiftUI iOS settings application. No web.");

    expect(preparation.status).toBe("review-required");
    if (preparation.status !== "review-required") throw new Error("Expected review-required preparation");
    expect(preparation.constraints.frameworks).toEqual(["swiftui"]);
    expect(preparation.reasons.join(" ")).toContain("registered generator");
    expect(preparation.questions.length).toBeGreaterThan(0);
  });

  it("rejects conflicting mobile and web constraints instead of guessing", () => {
    const preparation = orchestrator.prepare("Build a Swift SpriteKit iOS game and a React web dashboard.");

    expect(preparation.status).toBe("review-required");
    if (preparation.status !== "review-required") throw new Error("Expected review-required preparation");
    expect(preparation.constraints.platforms).toEqual(["mobile", "web"]);
    expect(preparation.reasons.join(" ")).toContain("requested constraints");
  });

  it("requires review for an unsupported explicit web framework", () => {
    const preparation = orchestrator.prepare("Build a Vue TypeScript web dashboard.");

    expect(preparation.status).toBe("review-required");
    if (preparation.status !== "review-required") throw new Error("Expected review-required preparation");
    expect(preparation.constraints.unrecognizedMentions).toContain("vue");
    expect(preparation.reasons.join(" ")).toContain("Unrecognized technology mentions");
  });
});
