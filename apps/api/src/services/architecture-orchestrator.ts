import { randomUUID } from "node:crypto";
import { createGeneratorRegistry, type ConstraintHints, type GeneratorDefinition, type GeneratorRegistry } from "@the-vault/prompts";
import { authorizedSynthesisContextSchema, type ArchitecturePacket, type ArchitectureSynthesisContext, type AuthorizationProvenance, type AuthorizedSynthesisContext, type BlueprintInput, type Classification, type DiscoveryResult, type ExplicitConstraints, type RegistryValidationResult } from "@the-vault/shared";
import { extractConstraints, type ConstraintExtraction } from "./constraint-extractor.js";

export type ArchitecturePreparation =
  | { status: "ready"; classification: Classification; generator: GeneratorDefinition; constraints: ConstraintExtraction; registryValidation: RegistryValidationResult; authorization: AuthorizationProvenance; authorizedContext: AuthorizedSynthesisContext }
  | { status: "review-required"; classification: Classification; constraints: ConstraintExtraction; reasons: string[]; questions: string[]; registryValidation?: RegistryValidationResult };

/** Kept as a compatibility view for callers that display the old handoff fields. */
export type ConfirmedHandoff = { registryVersion: string; discoveryUsed: boolean; selectedFromDiscovery: string | null; confirmedByUser: boolean };
export type ArchitectureSynthesisRequest = {
  brief: string;
  instruction: string;
  generatorId: string;
  synthesisContext: ArchitectureSynthesisContext;
  confirmedBrief: string;
  authorizedContext: AuthorizedSynthesisContext;
};

const ORCHESTRATOR_VERSION = "stage6-authority-v1";

export class ArchitectureOrchestrator {
  constructor(readonly registry: GeneratorRegistry = createGeneratorRegistry()) {}

  prepare(brief: string, generatorId?: string, discovery?: DiscoveryResult): ArchitecturePreparation {
    const constraints = extractConstraints(brief);
    if (!generatorId) {
      const classification = this.registry.classify(brief, constraints);
      return this.review(classification, constraints, ["A confirmed generatorId is required before final synthesis.", ...classification.reasons]);
    }
    return this.prepareConfirmed(brief, generatorId, discovery);
  }

  prepareConfirmed(brief: string, generatorId: string, discovery?: DiscoveryResult): ArchitecturePreparation {
    const constraints = extractConstraints(brief);
    const generator = this.registry.getGenerator(generatorId);
    const classification = this.registry.classify(brief, constraints);
    if (!generator) return this.review(classification, constraints, [`The confirmed generator ${generatorId} is not registered.`]);

    const evidence = generator.classify(brief, constraints);
    const classificationValidation = generator.validateClassification(evidence);
    const constraintValidation = generator.validateConstraints(constraints);
    const registryValidation = this.registry.validateRequest({
      generatorId,
      platform: constraints.platforms[0],
      language: constraints.languages[0],
      framework: constraints.frameworks[0],
      explicitConstraints: toExplicitConstraints(constraints),
      registryVersion: this.registry.registryVersion(),
      policyHash: generator.policy.policyHash
    });
    const discoveryViolations = discovery && discovery.status === "discovery" && discovery.likelyStackOptions.length > 0 && !discovery.likelyStackOptions.some((option) => option.stackId === generatorId)
      ? [`Confirmed generator ${generatorId} is not present in the authorized discovery options.`]
      : [];
    const reasons = [
      ...(constraints.unresolvedMentions.length > 0 ? [`Unrecognized technology mentions require review: ${constraints.unresolvedMentions.join(", ")}.`] : []),
      ...(registryValidation.violations.some((violation) => violation.code === "constraint-framework-conflict" || violation.code === "constraint-platform-conflict" || violation.code === "constraint-language-conflict") ? [`The requested constraints cannot be satisfied by a registered generator: ${[...constraints.platforms, ...constraints.languages, ...constraints.frameworks].join(", ")}.`] : []),
      ...(constraintValidation.errors),
      ...(classificationValidation.errors),
      ...registryValidation.violations.filter((violation) => violation.severity === "error").map((violation) => violation.message),
      ...discoveryViolations
    ];
    const finalClassification: Classification = { status: reasons.length > 0 ? "review-required" : "classified", evidence, reasons: [...new Set(reasons)] };
    if (finalClassification.status !== "classified" || registryValidation.status !== "passed" || !registryValidation.authorizedPolicy) return this.review(finalClassification, constraints, finalClassification.reasons, registryValidation);

    const authorization = this.createAuthorization(generator, constraints, discovery);
    const authorizedContext = authorizedSynthesisContextSchema.parse({
      confirmedBrief: brief.trim(),
      generatorPolicy: registryValidation.authorizedPolicy,
      validatedConstraints: toExplicitConstraints(constraints),
      registryVersion: registryValidation.registryVersion,
      policyHash: registryValidation.policyHash,
      provenance: authorization
    });
    return { status: "ready", classification: finalClassification, generator, constraints, registryValidation, authorization, authorizedContext };
  }

  buildSynthesisRequest(brief: string, preparation: Extract<ArchitecturePreparation, { status: "ready" }>): ArchitectureSynthesisRequest {
    return {
      brief,
      instruction: `${preparation.generator.buildInstruction()} ${constraintInstruction(preparation.constraints)}`,
      generatorId: preparation.generator.stackId,
      synthesisContext: preparation.generator.synthesisContext,
      confirmedBrief: preparation.authorizedContext.confirmedBrief,
      authorizedContext: preparation.authorizedContext
    };
  }

  /** The app passes this narrow object to providers. It contains no raw discovery or model reasoning. */
  buildAuthorizedProviderRequest(preparation: Extract<ArchitecturePreparation, { status: "ready" }>): { confirmedBrief: string; authorizedContext: AuthorizedSynthesisContext } {
    return { confirmedBrief: preparation.authorizedContext.confirmedBrief, authorizedContext: preparation.authorizedContext };
  }

  validatePacket(generator: GeneratorDefinition, packet: ArchitecturePacket) { return generator.validatePacket(packet); }

  createPacket(generator: GeneratorDefinition, brief: string, blueprint: BlueprintInput, classification: Classification, handoff?: ConfirmedHandoff, authorization?: AuthorizationProvenance): ArchitecturePacket {
    const packet = generator.createPacket(brief, blueprint, classification.evidence);
    const metadata = { ...packet.provenance.metadata, stage: "authorized-synthesis", ...(handoff ?? {}), ...(authorization ? { authorization } : {}) };
    return { ...packet, provenance: { ...packet.provenance, metadata } };
  }

  validateAuthorizedPacket(preparation: Extract<ArchitecturePreparation, { status: "ready" }>, packet: ArchitecturePacket) {
    const report = preparation.generator.validatePacket(packet);
    const errors = [...report.errors];
    if (packet.stack.id !== preparation.authorization.generatorId) errors.push("Packet generator ID does not match the authorization provenance.");
    if (packet.validation.generatorVersion !== preparation.authorization.generatorVersion) errors.push("Packet generator version does not match the authorization provenance.");
    const packetAuthorization = packet.provenance.metadata.authorization as Partial<AuthorizationProvenance> | undefined;
    if (packetAuthorization?.policyHash !== preparation.authorization.policyHash) errors.push("Packet policy hash does not match the authorization provenance.");
    return { status: errors.length > 0 ? "failed" as const : "passed" as const, errors, warnings: report.warnings };
  }

  private createAuthorization(generator: GeneratorDefinition, constraints: ConstraintExtraction, discovery?: DiscoveryResult): AuthorizationProvenance {
    return {
      requestId: randomUUID(),
      generatorId: generator.stackId,
      generatorVersion: generator.policy.versions.default ?? generator.policy.versions.generator,
      templateId: generator.policy.templates.find((template) => template.status === "supported")?.id,
      registryVersion: this.registry.registryVersion(),
      policyHash: generator.policy.policyHash,
      orchestratorVersion: ORCHESTRATOR_VERSION,
      validationStatus: "passed",
      discoveryUsed: Boolean(discovery),
      enrichmentSources: discovery?.enrichment.sources ?? [],
      confirmedByUser: true,
      createdAt: new Date().toISOString()
    };
  }

  private review(classification: Classification, constraints: ConstraintExtraction, reasons: string[], registryValidation?: RegistryValidationResult): ArchitecturePreparation {
    return { status: "review-required", classification, constraints, registryValidation, reasons: [...new Set(reasons)], questions: reviewQuestions(constraints, reasons) };
  }
}

function toExplicitConstraints(constraints: ConstraintExtraction): ExplicitConstraints {
  return {
    platforms: constraints.platforms,
    languages: constraints.languages,
    frameworks: constraints.frameworks,
    versions: constraints.versions,
    prohibitions: constraints.prohibitions,
    unresolvedMentions: constraints.unresolvedMentions
  };
}

function constraintInstruction(constraints: ConstraintHints): string {
  return [
    "The following constraints were extracted from the brief and are hard, non-overridable requirements.",
    `Required platforms: ${constraints.platforms.join(", ") || "none explicitly stated"}.`,
    `Required languages: ${constraints.languages.join(", ") || "none explicitly stated"}.`,
    `Required frameworks: ${constraints.frameworks.join(", ") || "none explicitly stated"}.`,
    `Pinned versions: ${(constraints.versions ?? []).map((version) => `${version.technology}@${version.version}`).join(", ") || "none explicitly stated"}.`,
    `Prohibited stacks or technologies: ${constraints.prohibitions.join(", ") || "none explicitly stated"}.`,
    "Never substitute a different platform, language, or framework. If the requested constraints cannot be satisfied, return REVIEW_REQUIRED with clarifying questions."
  ].join(" ");
}

function reviewQuestions(constraints: ConstraintExtraction, reasons: string[]): string[] {
  const questions: string[] = [];
  if (constraints.platforms.length > 1) questions.push(`Which target platform is authoritative: ${constraints.platforms.join(" or ")}?`);
  if (constraints.languages.length > 1) questions.push(`Which implementation language is authoritative: ${constraints.languages.join(" or ")}?`);
  if (constraints.frameworks.length > 1) questions.push(`Which framework should be used: ${constraints.frameworks.join(" or ")}?`);
  if (constraints.versions.length > 0 && reasons.some((reason) => reason.includes("version"))) questions.push(`Which supported version should be used: ${constraints.versions.map((version) => `${version.technology} ${version.version}`).join(", ")}?`);
  if (constraints.frameworks.length > 0 && reasons.some((reason) => reason.includes("registered") || reason.includes("supported"))) questions.push(`Should the brief select a registered framework instead of ${constraints.frameworks.join(", ")}?`);
  if (constraints.unresolvedMentions.length > 0) questions.push(`Should the brief remove unsupported technologies: ${constraints.unresolvedMentions.join(", ")}?`);
  if (questions.length === 0) questions.push("Which platform, language, or framework should the architecture target?");
  return questions;
}
