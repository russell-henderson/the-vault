import { describe, expect, it } from "vitest";
import { createGeneratorRegistry } from "@the-vault/prompts";

describe("registry-based architecture routing", () => {
  const registry = createGeneratorRegistry();

  it.each([
    ["Build a Swift SpriteKit mobile physics game with collision handling.", "swift-spritekit"],
    ["Build a Python Flet desktop form with local persistence.", "python-flet"],
    ["Build a React TypeScript web dashboard with an accessible API-backed view.", "react-typescript"]
  ])("classifies %s as %s", (brief, stackId) => {
    const result = registry.classify(brief);
    expect(result.status).toBe("classified");
    expect(result.evidence.recommendedStackId).toBe(stackId);
    expect(result.evidence.confidence).toBeGreaterThanOrEqual(0.78);
  });

  it("requires review for an unsupported or ambiguous brief", () => {
    const result = registry.classify("Build a Rust command-line compiler plugin.");
    expect(result.status).toBe("review-required");
    expect(result.reasons.join(" ")).toContain("confidence");
  });

  it("distinguishes SwiftUI from the registered SpriteKit generator", () => {
    const result = registry.classify("Build a SwiftUI mobile settings application.");
    expect(result.status).toBe("review-required");
    expect(result.evidence.recommendedStackId).toBe("swift-spritekit");
    expect(result.evidence.semanticIntegrity).toBeLessThan(0.8);
    expect(result.evidence.conflicts.join(" ")).toContain("SwiftUI");
  });

  it("requires review when strong signals conflict despite high confidence", () => {
    const result = registry.classify("Build a Swift SpriteKit physics game with a SwiftUI interface.");
    expect(result.evidence.confidence).toBeGreaterThanOrEqual(0.78);
    expect(result.evidence.semanticIntegrity).toBeLessThan(0.8);
    expect(result.status).toBe("review-required");
  });

  it("creates and validates a dynamic packet for the selected generator", () => {
    const classification = registry.classify("Build a Swift SpriteKit mobile physics game with collision handling.");
    const generator = registry.get("swift-spritekit");
    expect(generator).toBeDefined();
    if (!generator || classification.status !== "classified") throw new Error("Expected Swift classification and generator");

    const packet = generator.createPacket("Build a Swift SpriteKit mobile physics game with collision handling.", {
      name: "Physics Game",
      description: "A mobile physics scene",
      targetPath: "Sources/GameScene.swift",
      language: "Swift",
      framework: "SpriteKit",
      dependencies: ["SpriteKit"],
      architectureOverview: "Scene graph",
      coreLogic: "Physics",
      layoutDesign: "HUD",
      constraints: []
    }, classification.evidence);

    expect(packet.components.map((component) => component.kind)).toEqual(expect.arrayContaining(["PhysicsController", "SceneLayer", "PersistenceManager"]));
    expect(generator.validatePacket(packet)).toMatchObject({ status: "passed", errors: [] });
    expect(generator.validatePacket({ ...packet, stack: { ...packet.stack, framework: "React + Tailwind" } })).toMatchObject({ status: "failed" });
    expect(generator.validateClassification({ ...classification.evidence, recommendedStackId: "react-typescript" })).toMatchObject({ status: "failed" });
    expect(generator.buildInstruction()).toContain("first-principles reasoning");
    expect(generator.buildInstruction()).toContain("Required component kinds");
  });

  it("does not permit duplicate registry definitions", () => {
    const generator = registry.get("react-typescript");
    expect(generator).toBeDefined();
    if (!generator) throw new Error("Expected React generator");
    expect(() => registry.register(generator)).toThrow("already registered");
  });
});
