import { createGeneratorRegistry, type GeneratorDefinition, type GeneratorRegistry } from "@the-vault/prompts";
import type { ArchitecturePacket, ArchitectureSynthesisContext, BlueprintInput, Classification } from "@the-vault/shared";

export type ArchitecturePreparation =
  | { status: "ready"; classification: Classification; generator: GeneratorDefinition }
  | { status: "review-required"; classification: Classification; reasons: string[] };

export type ArchitectureSynthesisRequest = { brief: string; instruction: string; generatorId: string; synthesisContext: ArchitectureSynthesisContext };

export class ArchitectureOrchestrator {
  constructor(readonly registry: GeneratorRegistry = createGeneratorRegistry()) {}

  prepare(brief: string): ArchitecturePreparation {
    const classification = this.registry.classify(brief);
    if (classification.status !== "classified") return { status: "review-required", classification, reasons: classification.reasons };
    const generator = this.registry.get(classification.evidence.recommendedStackId);
    if (!generator) return { status: "review-required", classification, reasons: ["The recommended stack is not registered."] };
    const compatibility = generator.validateClassification(classification.evidence);
    if (compatibility.status !== "passed") return { status: "review-required", classification, reasons: compatibility.errors };
    return { status: "ready", classification, generator };
  }

  buildSynthesisRequest(brief: string, preparation: Extract<ArchitecturePreparation, { status: "ready" }>): ArchitectureSynthesisRequest {
    return { brief, instruction: preparation.generator.buildInstruction(), generatorId: preparation.generator.stackId, synthesisContext: preparation.generator.synthesisContext };
  }

  validatePacket(generator: GeneratorDefinition, packet: ArchitecturePacket) { return generator.validatePacket(packet); }

  createPacket(generator: GeneratorDefinition, brief: string, blueprint: BlueprintInput, classification: Classification): ArchitecturePacket {
    return generator.createPacket(brief, blueprint, classification.evidence);
  }
}
