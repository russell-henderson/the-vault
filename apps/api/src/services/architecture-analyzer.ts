import { discoveryResultSchema, type DiscoveryResult } from "@the-vault/shared";
import { createGeneratorRegistry, type GeneratorRegistry } from "@the-vault/prompts";
import { extractConstraints } from "./constraint-extractor.js";
import type { AiProvider } from "../providers/types.js";

export class ArchitectureAnalyzer {
  constructor(readonly registry: GeneratorRegistry = createGeneratorRegistry()) {}

  async analyze(brief: string, provider: AiProvider): Promise<DiscoveryResult> {
    const constraints = extractConstraints(brief);
    const authorizedIds = new Set(this.registry.getAuthorizedOptions().map((option) => option.stackId));
    const candidates = this.registry.discoverySlice(brief, constraints).filter(({ option }) => authorizedIds.has(option.stackId));
    const baseOptions = candidates.map(({ option, evidence }) => ({
      stackId: option.stackId,
      reason: `${option.language} with ${option.frameworkOptions.join(" / ")} fits the ${option.domainProfile} domain and matched ${evidence.intentSignals.join(", ") || "the available registry signals"}.`,
      confidence: evidence.confidence
    }));
    const baseEvidence = candidates.map(({ evidence }) => evidence);
    const noCandidates = candidates.length === 0;
    if (noCandidates) return discoveryResultSchema.parse(this.reviewResult(constraints, baseEvidence));

    let modelResult;
    const warnings: string[] = [];
    const unsupportedDiscoveries = constraints.unresolvedMentions.map((technology) => ({ technology, reason: "This technology was discovered in the brief but is not authorized by the current registry slice." }));
    try {
      modelResult = (await provider.generateDiscovery({ brief, registrySlice: candidates.map(({ option }) => option), constraints })).result;
    } catch (error) {
      warnings.push(error instanceof Error ? `Discovery provider unavailable; deterministic registry discovery used: ${error.message}` : "Discovery provider unavailable; deterministic registry discovery used.");
      modelResult = undefined;
    }

    const candidateIds = new Set(candidates.map(({ option }) => option.stackId));
    const returnedOptions = modelResult?.likelyStackOptions ?? baseOptions;
    const invalidIds = returnedOptions.map((option) => option.stackId).filter((stackId) => !candidateIds.has(stackId));
    const returnedRecommendation = modelResult?.recommendedStackId;
    if (invalidIds.length > 0 || (returnedRecommendation && !candidateIds.has(returnedRecommendation))) {
      return discoveryResultSchema.parse({
        ...this.reviewResult(constraints, baseEvidence),
        unsupportedDiscoveries: [...unsupportedDiscoveries, ...[...new Set([...invalidIds, returnedRecommendation ?? ""])].filter(Boolean).map((technology) => ({ technology, reason: "The enrichment result is outside the authorized registry slice." }))],
        reasons: [`The discovery provider returned an unsupported generator ID: ${[...new Set([...invalidIds, returnedRecommendation ?? ""])].filter(Boolean).join(", ")}.`],
        warnings,
        enrichment: { sources: [provider.name ?? "provider"], warnings }
      });
    }

    const preliminaryOptions = returnedOptions.length > 0 ? returnedOptions : baseOptions;
    const recommendation = returnedRecommendation ?? preliminaryOptions[0]?.stackId ?? null;
    const recommendationOption = recommendation ? baseOptions.find((option) => option.stackId === recommendation) : undefined;
    const selectedOptions = recommendationOption && !preliminaryOptions.some((option) => option.stackId === recommendation)
      ? [recommendationOption, ...preliminaryOptions]
      : preliminaryOptions;
    const domain = modelResult?.domain && candidates.some(({ option }) => option.domainProfile === modelResult.domain)
      ? modelResult.domain
      : candidates[0]?.option.domainProfile ?? null;
    const missingInfo = [...new Set([...(modelResult?.missingInfo ?? []), ...this.missingInfo(constraints, candidates.length)])].slice(0, 20);
    const clarifyingQuestions = [...new Set([...(modelResult?.clarifyingQuestions ?? []), ...this.questions(constraints, candidates.length)])].slice(0, 3);
    return discoveryResultSchema.parse({
      status: "discovery",
      domain,
      likelyStackOptions: selectedOptions.slice(0, 3),
      suggestedGeneratorId: recommendation,
      recommendedStackId: recommendation,
      missingInfo,
      clarifyingQuestions,
      constraints,
      evidence: baseEvidence,
      registryVersion: this.registry.registryVersion(),
      unsupportedDiscoveries,
      enrichment: { sources: [provider.name ?? "provider"], warnings },
      reasons: [],
      warnings
    });
  }

  private reviewResult(constraints: ReturnType<typeof extractConstraints>, evidence: ReturnType<GeneratorRegistry["discoveryCandidates"]>[number]["evidence"][]): DiscoveryResult {
    const requested = [...constraints.platforms, ...constraints.languages, ...constraints.frameworks];
    const reasons = [
      ...(constraints.unrecognizedMentions.length > 0 ? [`Unrecognized technology mentions require review: ${constraints.unrecognizedMentions.join(", ")}.`] : []),
      ...(requested.length > 0 ? [`No registered generator satisfies the requested constraints: ${requested.join(", ")}.`] : []),
      ...(constraints.prohibitions.length > 0 ? [`The requested prohibitions may exclude every registered generator: ${constraints.prohibitions.join(", ")}.`] : []),
      ...(requested.length === 0 && constraints.prohibitions.length === 0 ? ["The brief does not map to a supported registry domain yet."] : [])
    ];
    return {
      status: "review-required",
      domain: null,
      likelyStackOptions: [],
      suggestedGeneratorId: null,
      recommendedStackId: null,
      missingInfo: ["A supported platform, language, or framework"],
      clarifyingQuestions: ["Which supported platform and framework should the idea target?"],
      constraints,
      evidence,
      registryVersion: this.registry.registryVersion(),
      unsupportedDiscoveries: constraints.unresolvedMentions.map((technology) => ({ technology, reason: "This discovery is not supported by the current registry." })),
      enrichment: { sources: ["registry"], warnings: [] },
      reasons,
      warnings: []
    };
  }

  private missingInfo(constraints: ReturnType<typeof extractConstraints>, candidateCount: number): string[] {
    const missing: string[] = [];
    if (constraints.platforms.length === 0) missing.push("Target platform");
    if (constraints.languages.length === 0 && candidateCount > 1) missing.push("Preferred implementation language");
    if (constraints.frameworks.length === 0 && candidateCount > 1) missing.push("Preferred framework or interaction model");
    return missing;
  }

  private questions(constraints: ReturnType<typeof extractConstraints>, candidateCount: number): string[] {
    const questions: string[] = [];
    if (constraints.platforms.length === 0) questions.push("Should this be a mobile, desktop, or web application?");
    if (candidateCount > 1) questions.push("Which supported stack direction best matches the intended users and runtime?");
    if (constraints.languages.length === 0 && candidateCount > 1) questions.push("Do you have a preferred implementation language?");
    return questions;
  }
}
