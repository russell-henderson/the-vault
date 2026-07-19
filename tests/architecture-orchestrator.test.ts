import { describe, expect, it } from "vitest";
import { ArchitectureOrchestrator } from "../apps/api/src/services/architecture-orchestrator.js";

describe("architecture constraint gate", () => {
  const orchestrator = new ArchitectureOrchestrator();

  it("routes a supported non-web brief to its native generator", () => {
    const preparation = orchestrator.prepareConfirmed("Build a Swift SpriteKit iOS physics game with collision handling. No web.", "swift-spritekit");

    expect(preparation.status).toBe("ready");
    if (preparation.status !== "ready") throw new Error("Expected a ready preparation");
    expect(preparation.generator.stackId).toBe("swift-spritekit");
    expect(preparation.constraints.platforms).toEqual(["mobile"]);
    expect(preparation.constraints.languages).toEqual(["swift"]);
    expect(preparation.constraints.prohibitions).toContain("web");
    expect(orchestrator.buildSynthesisRequest("Swift SpriteKit iOS game", preparation).instruction).toContain("hard, non-overridable requirements");
  });

  it("does not substitute SpriteKit or React for an unsupported SwiftUI request", () => {
    const preparation = orchestrator.prepareConfirmed("Build a SwiftUI iOS settings application. No web.", "swift-spritekit");

    expect(preparation.status).toBe("review-required");
    if (preparation.status !== "review-required") throw new Error("Expected review-required preparation");
    expect(preparation.constraints.frameworks).toEqual(["swiftui"]);
    expect(preparation.reasons.join(" ")).toContain("registered generator");
    expect(preparation.questions.length).toBeGreaterThan(0);
  });

  it("rejects conflicting mobile and web constraints instead of guessing", () => {
    const preparation = orchestrator.prepareConfirmed("Build a Swift SpriteKit iOS game and a React web dashboard.", "swift-spritekit");

    expect(preparation.status).toBe("review-required");
    if (preparation.status !== "review-required") throw new Error("Expected review-required preparation");
    expect(preparation.constraints.platforms).toEqual(["mobile", "web"]);
    expect(preparation.reasons.join(" ")).toContain("requested constraints");
  });

  it("requires review for an unsupported explicit web framework", () => {
    const preparation = orchestrator.prepareConfirmed("Build a Vue TypeScript web dashboard.", "react-typescript");

    expect(preparation.status).toBe("review-required");
    if (preparation.status !== "review-required") throw new Error("Expected review-required preparation");
    expect(preparation.constraints.unrecognizedMentions).toContain("vue");
    expect(preparation.reasons.join(" ")).toContain("Unrecognized technology mentions");
  });

  it("requires an explicit generator before final synthesis", () => {
    const preparation = orchestrator.prepare("Build a React TypeScript web dashboard.");

    expect(preparation.status).toBe("review-required");
    if (preparation.status !== "review-required") throw new Error("Expected review-required preparation");
    expect(preparation.reasons.join(" ")).toContain("confirmed generatorId");
  });

  it("inherits primary requirements for Fleet Controller secondary intent", () => {
    const preparation = orchestrator.prepareConfirmed("Build a React dashboard with frontend components for monitoring telemetry and showing fleet status.", "react-typescript");

    expect(preparation.status).toBe("ready");
    if (preparation.status !== "ready") throw new Error("Expected inherited capabilities to authorize the React generator");
    expect(preparation.constraints.frameworks).toContain("react");
    expect(preparation.generator.policy.policyMetadata.capabilities.primary).toEqual(["react", "typescript", "tailwind"]);
    expect(preparation.generator.policy.policyMetadata.capabilities.secondary.infrastructure).toContain("telemetry");
  });

});
