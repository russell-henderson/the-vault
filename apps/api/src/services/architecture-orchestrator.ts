import { createGeneratorRegistry, type ConstraintHints, type GeneratorDefinition, type GeneratorRegistry } from "@the-vault/prompts";
import type { ArchitecturePacket, ArchitectureSynthesisContext, BlueprintInput, Classification } from "@the-vault/shared";
import { extractConstraints, type ConstraintExtraction } from "./constraint-extractor.js";

export type ArchitecturePreparation =
  | { status: "ready"; classification: Classification; generator: GeneratorDefinition; constraints: ConstraintExtraction }
  | { status: "review-required"; classification: Classification; constraints: ConstraintExtraction; reasons: string[]; questions: string[] };

export type ArchitectureSynthesisRequest = { brief: string; instruction: string; generatorId: string; synthesisContext: ArchitectureSynthesisContext };

export class ArchitectureOrchestrator {
  constructor(readonly registry: GeneratorRegistry = createGeneratorRegistry()) {}

  prepare(brief: string): ArchitecturePreparation {
    const constraints = extractConstraints(brief);
    const classification = this.registry.classify(brief, constraints);
    if (classification.status !== "classified") return this.review(classification, constraints, classification.reasons);
    const generator = this.registry.get(classification.evidence.recommendedStackId);
    if (!generator) return this.review(classification, constraints, ["The recommended stack is not registered."]);
    const constraintValidation = generator.validateConstraints(constraints);
    if (constraintValidation.status !== "passed") return this.review(classification, constraints, constraintValidation.errors);
    const compatibility = generator.validateClassification(classification.evidence);
    if (compatibility.status !== "passed") return this.review(classification, constraints, compatibility.errors);
    return { status: "ready", classification, generator, constraints };
  }

  buildSynthesisRequest(brief: string, preparation: Extract<ArchitecturePreparation, { status: "ready" }>): ArchitectureSynthesisRequest {
    return {
      brief,
      instruction: `${preparation.generator.buildInstruction()} ${constraintInstruction(preparation.constraints)}`,
      generatorId: preparation.generator.stackId,
      synthesisContext: preparation.generator.synthesisContext
    };
  }

  validatePacket(generator: GeneratorDefinition, packet: ArchitecturePacket) { return generator.validatePacket(packet); }

  createPacket(generator: GeneratorDefinition, brief: string, blueprint: BlueprintInput, classification: Classification): ArchitecturePacket {
    return generator.createPacket(brief, blueprint, classification.evidence);
  }

  private review(classification: Classification, constraints: ConstraintExtraction, reasons: string[]): ArchitecturePreparation {
    return { status: "review-required", classification, constraints, reasons: [...new Set(reasons)], questions: reviewQuestions(constraints, reasons) };
  }
}

function constraintInstruction(constraints: ConstraintHints): string {
  return [
    "The following constraints were extracted from the brief and are hard, non-overridable requirements.",
    `Required platforms: ${constraints.platforms.join(", ") || "none explicitly stated"}.`,
    `Required languages: ${constraints.languages.join(", ") || "none explicitly stated"}.`,
    `Required frameworks: ${constraints.frameworks.join(", ") || "none explicitly stated"}.`,
    `Prohibited stacks or technologies: ${constraints.prohibitions.join(", ") || "none explicitly stated"}.`,
    "Never substitute a different platform, language, or framework. If the requested constraints cannot be satisfied, return REVIEW_REQUIRED with clarifying questions."
  ].join(" ");
}

function reviewQuestions(constraints: ConstraintExtraction, reasons: string[]): string[] {
  const questions: string[] = [];
  if (constraints.platforms.length > 1) questions.push(`Which target platform is authoritative: ${constraints.platforms.join(" or ")}?`);
  if (constraints.languages.length > 1) questions.push(`Which implementation language is authoritative: ${constraints.languages.join(" or ")}?`);
  if (constraints.frameworks.length > 1) questions.push(`Which framework should be used: ${constraints.frameworks.join(" or ")}?`);
  if (constraints.frameworks.length > 0 && reasons.some((reason) => reason.includes("No registered generator"))) questions.push(`Should a generator be added for ${constraints.frameworks.join(", ")}, or should the brief select a registered framework?`);
  if (constraints.unrecognizedMentions.length > 0) questions.push(`Should a generator be added for ${constraints.unrecognizedMentions.join(", ")}, or should the brief select a registered technology?`);
  if (constraints.prohibitions.length > 0 && reasons.some((reason) => reason.includes("exclude") || reason.includes("prohibits"))) questions.push(`Which requested technology should be removed or changed to resolve the prohibition: ${constraints.prohibitions.join(", ")}?`);
  if (questions.length === 0) questions.push("Which platform, language, or framework should the architecture target?");
  return questions;
}
