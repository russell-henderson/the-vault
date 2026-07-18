import { architecturePacketSchema, architectureSynthesisContextSchema, discoveryRegistryOptionSchema, generatorPolicySchema, registryValidationResultSchema, type ArchitecturePacket, type ArchitectureSynthesisContext, type BlueprintInput, type Classification, type ClassificationEvidence, type CoreDocumentFilename, type DiscoveryRegistryOption, type ExplicitConstraints, type GeneratorPolicy, type RegistryValidationRequest, type RegistryValidationResult, type ValidationReport } from "@the-vault/shared";

export type GeneratorId = "swift-spritekit" | "python-flet" | "react-typescript";
export type DomainProfile = "mobile-physics" | "desktop-ui" | "web-dashboard";
export type SignalCategory = "language" | "framework" | "platform" | "domain" | "supporting";

export type SignalRule = { id: string; phrases: string[]; weight: number; category: SignalCategory };
export type ConflictRule = { id: string; phrases: string[]; reason: string };
export type ConstraintHints = {
  platforms: string[];
  languages: string[];
  frameworks: string[];
  stackMentions: string[];
  prohibitions: string[];
  unrecognizedMentions: string[];
  versions?: Array<{ technology: string; version: string }>;
  unresolvedMentions?: string[];
};

export type GeneratorDiscoveryOption = DiscoveryRegistryOption;
export type RegistryFilters = {
  generatorIds?: string[];
  platform?: string;
  language?: string;
  framework?: string;
  requiredCapabilities?: string[];
  lifecycleStatuses?: Array<GeneratorPolicy["lifecycle"]["status"]>;
  explicitConstraints?: ExplicitConstraints;
};

export type GeneratorCapability = {
  id: string;
  stackId: GeneratorId;
  domainProfile: DomainProfile;
  platform: "mobile" | "desktop" | "web";
  supportedIntentSignals: string[];
  architecturalTraits: string[];
  requiredComponentKinds: string[];
  synthesisContext: ArchitectureSynthesisContext;
};

export type RegistryDiscoveryCandidate = {
  option: DiscoveryRegistryOption;
  evidence: ClassificationEvidence;
};

export type GeneratorDefinition = GeneratorCapability & {
  policy: GeneratorPolicy;
  version: string;
  signalRules: SignalRule[];
  conflictRules: ConflictRule[];
  language: string;
  frameworkOptions: string[];
  constraints: string[];
  prohibitedSubstitutions: string[];
  classify(brief: string, constraints?: ConstraintHints): ClassificationEvidence;
  buildInstruction(): string;
  createPacket(brief: string, blueprint: BlueprintInput, evidence: ClassificationEvidence): ArchitecturePacket;
  validateClassification(evidence: ClassificationEvidence): ValidationReport;
  validateConstraints(constraints: ConstraintHints): ValidationReport;
  validatePacket(packet: ArchitecturePacket): ValidationReport;
};

export const CONFIDENCE_THRESHOLD = 0.78;
export const SEMANTIC_INTEGRITY_THRESHOLD = 0.8;
export const ALTERNATIVE_MARGIN = 0.1;

function hashText(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return `fnv1a-${(hash >>> 0).toString(16)}`;
}

function tokenize(value: string): string[] {
  return value.toLocaleLowerCase().normalize("NFKC").replace(/\+/g, " ").replace(/[^a-z0-9#]+/g, " ").trim().split(/\s+/).filter(Boolean);
}

function phraseMatches(tokens: string[], phrase: string): boolean {
  const phraseTokens = tokenize(phrase);
  if (phraseTokens.length === 0 || phraseTokens.length > tokens.length) return false;
  for (let index = 0; index <= tokens.length - phraseTokens.length; index += 1) {
    if (phraseTokens.every((token, offset) => tokens[index + offset] === token)) return true;
  }
  return false;
}

function ruleMatches(tokens: string[], rule: SignalRule | ConflictRule): boolean {
  return rule.phrases.some((phrase) => phraseMatches(tokens, phrase));
}

function contextFor(config: Omit<GeneratorDefinition, "classify" | "buildInstruction" | "createPacket" | "validateClassification" | "validateConstraints" | "validatePacket" | "synthesisContext" | "policy">): ArchitectureSynthesisContext {
  return architectureSynthesisContextSchema.parse({
    stackId: config.stackId,
    domainProfile: config.domainProfile,
    platform: config.platform,
    language: config.language,
    frameworkOptions: config.frameworkOptions,
    requiredComponentKinds: config.requiredComponentKinds,
    architecturalTraits: config.architecturalTraits,
    constraints: config.constraints,
    prohibitedSubstitutions: config.prohibitedSubstitutions
  });
}

function policyFor(config: Omit<GeneratorDefinition, "classify" | "buildInstruction" | "createPacket" | "validateClassification" | "validateConstraints" | "validatePacket" | "synthesisContext" | "policy">): GeneratorPolicy {
  const base = {
    id: config.stackId,
    name: config.stackId,
    implementation: {
      platform: config.platform,
      language: config.language,
      frameworks: config.frameworkOptions,
      capabilities: config.requiredComponentKinds,
      capabilityFingerprint: [...config.supportedIntentSignals, ...config.requiredComponentKinds].sort()
    },
    versions: { generator: config.version, supported: [config.version], default: config.version },
    templates: [{ id: `${config.stackId}-default`, supportedVersions: [config.version], status: "supported" as const }],
    constraints: { requires: config.constraints, conflicts: config.prohibitedSubstitutions },
    lifecycle: { status: "supported" as const },
    metadata: { owner: "vault-architecture", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-07-17T00:00:00.000Z" }
  };
  return generatorPolicySchema.parse({ ...base, policyHash: hashText(JSON.stringify(base)) });
}

function evidenceFor(config: GeneratorDefinition, brief: string, constraints?: ConstraintHints): ClassificationEvidence {
  const tokens = tokenize(brief);
  const matchedRules = config.signalRules.filter((rule) => ruleMatches(tokens, rule));
  const conflicts = config.conflictRules
    .filter((rule) => rule.phrases.some((phrase) => phraseMatches(tokens, phrase) && !isProhibitedPhrase(phrase, constraints)))
    .map((rule) => rule.reason);
  const intentSignals = matchedRules.map((rule) => rule.id);
  const positiveScore = matchedRules.reduce((total, rule) => total + rule.weight, 0);
  const frameworkMatched = matchedRules.some((rule) => rule.category === "framework");
  const domainMatches = matchedRules.filter((rule) => rule.category === "domain" || rule.category === "platform").length;
  const hasDomainAnchor = frameworkMatched || domainMatches >= 2 || matchedRules.some((rule) => rule.weight >= 6);
  const semanticIntegrity = conflicts.length > 0 ? Math.max(0, 0.35 - (conflicts.length - 1) * 0.1) : hasDomainAnchor ? 1 : matchedRules.length >= 2 ? 0.72 : 0.4;
  const confidence = hasDomainAnchor ? Math.min(0.99, 0.55 + Math.min(0.4, positiveScore / 20)) : Math.min(0.74, 0.2 + Math.min(0.54, positiveScore / 20));
  return { recommendedStackId: config.stackId, recommendedDomain: config.domainProfile, recommendedPlatform: config.platform, intentSignals, architecturalRequirements: config.architecturalTraits, confidence, semanticIntegrity, conflicts, alternatives: [], classifierVersion: "registry-v2-signal-logic" };
}

function packetFor(config: GeneratorDefinition, brief: string, blueprint: BlueprintInput, evidence: ClassificationEvidence): ArchitecturePacket {
  const packetId = `packet-${hashText(`${config.stackId}:${brief}:${blueprint.name}`)}`;
  const components = config.requiredComponentKinds.map((kind, index) => ({ id: `${packetId}-${index + 1}`, kind, name: kind, responsibility: `${kind} synthesized for ${blueprint.name}.`, inputs: [], outputs: [], dependencies: blueprint.dependencies, constraints: [...config.constraints, ...blueprint.constraints] }));
  const packetWithoutProvenance = { packetVersion: "2" as const, packetId, stack: { id: config.stackId, language: blueprint.language, framework: blueprint.framework, platform: config.platform, domainProfile: config.domainProfile }, intent: { summary: blueprint.description, signals: evidence.intentSignals, architecturalRequirements: [...config.architecturalTraits, ...config.constraints] }, component: { name: blueprint.name, purpose: blueprint.description, targetPath: blueprint.targetPath }, components, architecture: { layers: [{ id: `${packetId}-layer`, name: config.domainProfile, purpose: blueprint.architectureOverview, componentIds: components.map((component) => component.id) }], dataFlows: [], constraints: [...config.constraints, ...blueprint.constraints], dependencies: blueprint.dependencies }, validation: { status: "passed" as const, generatorVersion: config.version, errors: [], warnings: [] } };
  const contentHash = hashText(JSON.stringify(packetWithoutProvenance));
  return { ...packetWithoutProvenance, provenance: { id: `provenance-${contentHash}`, nodeId: packetId, nodeType: "packet", parentIds: [`brief-${hashText(brief)}`, `classification-${hashText(JSON.stringify(evidence))}`], rootId: packetId, contentHash, metadata: { generatorId: config.stackId, generatorVersion: config.version, classificationConfidence: evidence.confidence, semanticIntegrity: evidence.semanticIntegrity }, createdAt: new Date().toISOString() } };
}

function validateFor(config: GeneratorDefinition, evidence: ClassificationEvidence): ValidationReport {
  const errors: string[] = [];
  if (evidence.recommendedStackId !== config.stackId) errors.push(`Classification selected ${evidence.recommendedStackId}, not ${config.stackId}.`);
  if (evidence.recommendedDomain !== config.domainProfile) errors.push(`Classification domain ${evidence.recommendedDomain} does not match ${config.domainProfile}.`);
  if (evidence.recommendedPlatform !== config.platform) errors.push(`Classification platform ${evidence.recommendedPlatform} does not match ${config.platform}.`);
  if (evidence.confidence < CONFIDENCE_THRESHOLD) errors.push("Classification confidence is below the safety threshold.");
  if (evidence.semanticIntegrity < SEMANTIC_INTEGRITY_THRESHOLD) errors.push("Classification semantic integrity is below the safety threshold.");
  for (const conflict of evidence.conflicts) errors.push(`Classification conflict: ${conflict}`);
  return { status: errors.length > 0 ? "failed" : "passed", errors, warnings: [] };
}

function normalizedTokens(value: string): string[] {
  return tokenize(value);
}

function valueMatches(candidate: string, requested: string): boolean {
  const candidateTokens = normalizedTokens(candidate);
  const requestedTokens = normalizedTokens(requested);
  if (requestedTokens.length === 0) return false;
  return requestedTokens.every((token, index) => candidateTokens[index] === token) || phraseMatches(candidateTokens, requested);
}

function anyValueMatches(candidates: string[], requested: string[]): boolean {
  return requested.some((requirement) => candidates.some((candidate) => valueMatches(candidate, requirement)));
}

function allValuesMatch(candidates: string[], requested: string[]): boolean {
  return requested.every((requirement) => candidates.some((candidate) => valueMatches(candidate, requirement)));
}

function isProhibitedPhrase(phrase: string, constraints?: ConstraintHints): boolean {
  if (!constraints || constraints.prohibitions.length === 0) return false;
  const phraseTokens = tokenize(phrase);
  return constraints.prohibitions.some((prohibition) => tokenize(prohibition).some((token) => phraseTokens.includes(token)));
}

function constraintErrorsFor(config: GeneratorDefinition, constraints: ConstraintHints): string[] {
  const errors: string[] = [];
  if (constraints.platforms.length > 0 && !allValuesMatch([config.platform], constraints.platforms)) {
    errors.push(`Requested platform ${constraints.platforms.join(", ")} is incompatible with ${config.platform}.`);
  }
  if (constraints.languages.length > 0 && !allValuesMatch([config.language], constraints.languages)) {
    errors.push(`Requested language ${constraints.languages.join(", ")} is not supported by ${config.stackId}.`);
  }
  if (constraints.frameworks.length > 0 && !allValuesMatch(config.frameworkOptions, constraints.frameworks)) {
    errors.push(`Requested framework ${constraints.frameworks.join(", ")} is not supported by ${config.stackId}.`);
  }

  const prohibitedCandidates = [config.stackId, config.platform, config.language, ...config.frameworkOptions];
  for (const prohibition of constraints.prohibitions) {
    if (anyValueMatches(prohibitedCandidates, [prohibition])) errors.push(`The brief prohibits ${prohibition}, which conflicts with ${config.stackId}.`);
  }
  return errors;
}

function validatePacketFor(config: GeneratorDefinition, packet: ArchitecturePacket): ValidationReport {
  const parsed = architecturePacketSchema.safeParse(packet);
  const errors = parsed.success ? [] : parsed.error.issues.map((issue) => issue.path.join(".") || issue.message);
  if (packet.stack.id !== config.stackId) errors.push(`Packet stack ${packet.stack.id} does not match ${config.stackId}.`);
  if (packet.stack.language !== config.synthesisContext.language) errors.push(`Packet language ${packet.stack.language} does not match ${config.synthesisContext.language}.`);
  if (!config.synthesisContext.frameworkOptions.includes(packet.stack.framework)) errors.push(`Packet framework ${packet.stack.framework} is not allowed for ${config.stackId}.`);
  if (packet.stack.domainProfile !== config.domainProfile) errors.push(`Packet domain ${packet.stack.domainProfile} does not match ${config.domainProfile}.`);
  for (const required of config.requiredComponentKinds) if (!packet.components.some((component) => component.kind === required)) errors.push(`Missing required ${required} component.`);
  const componentIds = new Set(packet.components.map((component) => component.id));
  for (const layer of packet.architecture.layers) for (const componentId of layer.componentIds) if (!componentIds.has(componentId)) errors.push(`Layer ${layer.name} references unknown component ${componentId}.`);
  return { status: errors.length > 0 ? "failed" : "passed", errors, warnings: [] };
}

function definition(config: Omit<GeneratorDefinition, "classify" | "buildInstruction" | "createPacket" | "validateClassification" | "validateConstraints" | "validatePacket" | "synthesisContext" | "policy">): GeneratorDefinition {
  const synthesisContext = contextFor(config);
  const policy = policyFor(config);
  return {
    ...config,
    policy,
    synthesisContext,
    classify: (brief, constraints) => evidenceFor({ ...config, synthesisContext } as GeneratorDefinition, brief, constraints),
    buildInstruction: () => [
      "You are an architecture synthesis engine. Derive the blueprint from the user brief using first-principles reasoning.",
      "The registry provides constraints and required components only; do not copy a pre-defined template or silently substitute another stack.",
      `Domain: ${synthesisContext.domainProfile}. Platform: ${synthesisContext.platform}. Language: ${synthesisContext.language}.`,
      `Allowed framework choices: ${synthesisContext.frameworkOptions.join(", ")}.`,
      `Required component kinds: ${synthesisContext.requiredComponentKinds.join(", ")}.`,
      `Architectural traits to preserve: ${synthesisContext.architecturalTraits.join("; ")}.`,
      `Hard constraints: ${synthesisContext.constraints.join("; ")}.`,
      `Prohibited substitutions: ${synthesisContext.prohibitedSubstitutions.join("; ")}.`,
      "Return a complete structured blueprint whose language, framework, and architecture are justified by the brief and satisfy every constraint."
    ].join(" "),
    createPacket: (brief, blueprint, evidence) => packetFor({ ...config, synthesisContext } as GeneratorDefinition, brief, blueprint, evidence),
    validateClassification: (evidence) => validateFor({ ...config, synthesisContext } as GeneratorDefinition, evidence),
    validateConstraints: (constraints) => {
      const errors = constraintErrorsFor({ ...config, synthesisContext } as GeneratorDefinition, constraints);
      return { status: errors.length > 0 ? "failed" : "passed", errors, warnings: [] };
    },
    validatePacket: (packet) => validatePacketFor({ ...config, synthesisContext } as GeneratorDefinition, packet)
  };
}

function discoveryOption(generator: GeneratorDefinition): DiscoveryRegistryOption {
  return discoveryRegistryOptionSchema.parse({
    stackId: generator.stackId,
    domainProfile: generator.domainProfile,
    platform: generator.platform,
    language: generator.language,
    frameworkOptions: generator.frameworkOptions,
    supportedIntentSignals: generator.supportedIntentSignals,
    architecturalTraits: generator.architecturalTraits,
    requiredComponentKinds: generator.requiredComponentKinds,
    constraints: generator.constraints,
    prohibitedSubstitutions: generator.prohibitedSubstitutions,
    version: generator.version,
    policyHash: generator.policy.policyHash,
    lifecycleStatus: generator.policy.lifecycle.status
  });
}

export function createGeneratorRegistry(): GeneratorRegistry {
  return new GeneratorRegistry([
    definition({ id: "swift-spritekit", stackId: "swift-spritekit", domainProfile: "mobile-physics", platform: "mobile", version: "2.0.0", requiredComponentKinds: ["PhysicsController", "SceneLayer", "EntityNode", "InputController", "PersistenceManager"], supportedIntentSignals: ["swift", "spritekit", "ios", "mobile", "physics", "collision", "sprite", "game loop"], architecturalTraits: ["scene graph", "physics loop", "touch input"], language: "Swift", frameworkOptions: ["SpriteKit"], constraints: ["Keep physics state inside the scene boundary.", "Keep entity lifecycle and collision rules explicit."], prohibitedSubstitutions: ["SwiftUI without SpriteKit intent", "React", "Flet"], signalRules: [{ id: "swift", phrases: ["swift"], weight: 2, category: "language" }, { id: "spritekit", phrases: ["spritekit"], weight: 8, category: "framework" }, { id: "ios", phrases: ["ios", "iphone", "ipad"], weight: 3, category: "platform" }, { id: "mobile", phrases: ["mobile", "mobile app"], weight: 2, category: "platform" }, { id: "physics", phrases: ["physics", "physics simulation"], weight: 4, category: "domain" }, { id: "collision", phrases: ["collision", "collision handling"], weight: 3, category: "domain" }, { id: "sprite", phrases: ["sprite", "sprites"], weight: 2, category: "domain" }, { id: "game-loop", phrases: ["game loop", "game-loop", "update loop"], weight: 3, category: "domain" }], conflictRules: [{ id: "swiftui-conflict", phrases: ["swiftui", "swift ui"], reason: "SwiftUI intent is distinct from SpriteKit and no SwiftUI generator is registered." }, { id: "web-conflict", phrases: ["react", "tailwind", "browser", "web dashboard"], reason: "Web UI signals conflict with the mobile physics generator." }] }),
    definition({ id: "python-flet", stackId: "python-flet", domainProfile: "desktop-ui", platform: "desktop", version: "2.0.0", requiredComponentKinds: ["ViewLayer", "EventController", "StateModel", "ServiceAdapter", "PersistenceManager"], supportedIntentSignals: ["python", "flet", "desktop", "window", "form", "native app"], architecturalTraits: ["window lifecycle", "event handlers", "desktop persistence"], language: "Python", frameworkOptions: ["Flet"], constraints: ["Keep persistence behind the adapter boundary.", "Keep desktop event handlers separate from view composition."], prohibitedSubstitutions: ["SpriteKit", "React", "SwiftUI"], signalRules: [{ id: "python", phrases: ["python"], weight: 3, category: "language" }, { id: "flet", phrases: ["flet"], weight: 8, category: "framework" }, { id: "desktop", phrases: ["desktop", "desktop app"], weight: 3, category: "platform" }, { id: "window", phrases: ["window", "windowed"], weight: 2, category: "domain" }, { id: "form", phrases: ["form", "forms"], weight: 2, category: "domain" }, { id: "native-app", phrases: ["native app", "desktop ui"], weight: 3, category: "domain" }], conflictRules: [{ id: "mobile-conflict", phrases: ["spritekit", "swiftui", "ios", "iphone"], reason: "Mobile framework signals conflict with the desktop UI generator." }, { id: "web-conflict", phrases: ["react", "browser", "web dashboard"], reason: "Web UI signals conflict with the desktop UI generator." }] }),
    definition({ id: "react-typescript", stackId: "react-typescript", domainProfile: "web-dashboard", platform: "web", version: "2.0.0", requiredComponentKinds: ["ViewLayer", "StateController", "ApiAdapter", "AccessibilityLayer", "PersistenceManager"], supportedIntentSignals: ["react", "typescript", "tsx", "web", "browser", "dashboard", "analytics", "panel", "tailwind", "responsive", "accessible"], architecturalTraits: ["browser UI", "API boundary", "responsive accessibility"], language: "TypeScript", frameworkOptions: ["React", "React + Tailwind"], constraints: ["Keep server persistence behind the API boundary.", "Render explicit loading, error, empty, and ready states.", "Preserve keyboard accessibility."], prohibitedSubstitutions: ["SpriteKit", "Flet", "SwiftUI"], signalRules: [{ id: "react", phrases: ["react"], weight: 7, category: "framework" }, { id: "typescript", phrases: ["typescript", "type script"], weight: 4, category: "language" }, { id: "tsx", phrases: ["tsx"], weight: 4, category: "language" }, { id: "web", phrases: ["web", "website", "web app"], weight: 3, category: "platform" }, { id: "browser", phrases: ["browser"], weight: 3, category: "platform" }, { id: "dashboard", phrases: ["dashboard", "admin dashboard"], weight: 5, category: "domain" }, { id: "analytics", phrases: ["analytics", "analytics panel"], weight: 3, category: "domain" }, { id: "panel", phrases: ["panel", "panels"], weight: 2, category: "domain" }, { id: "tailwind", phrases: ["tailwind"], weight: 3, category: "framework" }, { id: "responsive", phrases: ["responsive"], weight: 2, category: "supporting" }, { id: "accessible", phrases: ["accessible", "accessibility", "keyboard navigation"], weight: 2, category: "supporting" }], conflictRules: [{ id: "mobile-conflict", phrases: ["spritekit", "swiftui", "ios", "iphone"], reason: "Mobile framework signals conflict with the web dashboard generator." }, { id: "desktop-conflict", phrases: ["flet", "desktop app", "native app"], reason: "Desktop UI signals conflict with the web dashboard generator." }] })
  ]);
}

export class GeneratorRegistry {
  private readonly definitions = new Map<string, GeneratorDefinition>();

  constructor(definitions: GeneratorDefinition[] = []) { for (const generator of definitions) this.register(generator); }
  register(generator: GeneratorDefinition): void { if (this.definitions.has(generator.stackId)) throw new Error(`Generator already registered: ${generator.stackId}`); this.definitions.set(generator.stackId, generator); }
  listCapabilities(): GeneratorCapability[] { return [...this.definitions.values()].map(({ version: _version, policy: _policy, signalRules: _signals, conflictRules: _conflicts, classify: _classify, buildInstruction: _build, createPacket: _packet, validateClassification: _classification, validateConstraints: _constraints, validatePacket: _validate, ...capability }) => capability); }
  getGenerator(id: string): GeneratorDefinition | undefined { return this.definitions.get(id); }
  get(stackId: string): GeneratorDefinition | undefined { return this.getGenerator(stackId); }
  isSupported(id: string): boolean {
    const generator = this.getGenerator(id);
    return Boolean(generator && ["supported", "experimental"].includes(generator.policy.lifecycle.status) && generator.policy.templates.some((template) => template.status === "supported" || template.status === "experimental"));
  }
  registryVersion(): string { return "registry-v3-authority"; }

  validateRequest(request: RegistryValidationRequest): RegistryValidationResult {
    const generator = this.getGenerator(request.generatorId);
    const registryVersion = this.registryVersion();
    const policyHash = generator?.policy.policyHash ?? "unknown-policy";
    const violations: RegistryValidationResult["violations"] = [];
    const error = (code: string, message: string) => violations.push({ code, message, severity: "error" as const });
    if (!generator) {
      error("unknown-generator", `Generator ${request.generatorId} is not registered.`);
      return registryValidationResultSchema.parse({ status: "review-required", generatorId: request.generatorId, registryVersion, policyHash, authorizedPolicy: null, violations });
    }
    const policy = generator.policy;
    if (request.registryVersion && request.registryVersion !== registryVersion) error("registry-version-mismatch", `Request pins ${request.registryVersion}, but the active registry is ${registryVersion}.`);
    if (request.policyHash && request.policyHash !== policy.policyHash) error("policy-hash-mismatch", `Request policy hash does not match the registered ${request.generatorId} policy.`);
    if (policy.lifecycle.status === "disabled") error("disabled-generator", `Generator ${request.generatorId} is disabled.`);
    if (policy.lifecycle.status === "deprecated" && request.allowDeprecated !== true) error("deprecated-generator", `Generator ${request.generatorId} requires an explicit trusted deprecated override.`);
    const requestedVersion = request.requestedVersion ?? policy.versions.default ?? policy.versions.generator;
    if (!policy.versions.supported.includes(requestedVersion)) error("unsupported-version", `Generator version ${requestedVersion} is not supported for ${request.generatorId}.`);
    const template = request.templateId ? policy.templates.find((candidate) => candidate.id === request.templateId) : policy.templates.find((candidate) => candidate.status === "supported");
    if (request.templateId && !template) error("unknown-template", `Template ${request.templateId} is not registered for ${request.generatorId}.`);
    if (!request.templateId && !template) error("no-authorized-template", `Generator ${request.generatorId} has no supported template.`);
    if (template && template.status === "disabled") error("disabled-template", `Template ${template.id} is disabled.`);
    if (template && template.status === "deprecated" && request.allowDeprecated !== true) error("deprecated-template", `Template ${template.id} requires an explicit trusted deprecated override.`);
    if (template && !template.supportedVersions.includes(requestedVersion)) error("template-version-mismatch", `Template ${template.id} does not support generator version ${requestedVersion}.`);
    if (request.platform && !valueMatches(policy.implementation.platform, request.platform)) error("platform-incompatible", `Requested platform ${request.platform} is incompatible with ${policy.implementation.platform}.`);
    if (request.language && !valueMatches(policy.implementation.language, request.language)) error("language-incompatible", `Requested language ${request.language} is incompatible with ${policy.implementation.language}.`);
    if (request.framework && !policy.implementation.frameworks.some((framework) => valueMatches(framework, request.framework ?? ""))) error("framework-incompatible", `Requested framework ${request.framework} is not supported by ${request.generatorId}.`);
    const capabilities = new Set([...policy.implementation.capabilities, ...policy.implementation.capabilityFingerprint]);
    for (const capability of request.requiredCapabilities ?? []) if (![...capabilities].some((candidate) => valueMatches(candidate, capability))) error("capability-incompatible", `Required capability ${capability} is not supported by ${request.generatorId}.`);
    const explicit = request.explicitConstraints;
    if (explicit.unresolvedMentions.length > 0) for (const mention of explicit.unresolvedMentions) error("unsupported-discovery", `Unresolved technology ${mention} cannot authorize synthesis.`);
    if (explicit.platforms.length > 0 && !explicit.platforms.every((platform) => valueMatches(policy.implementation.platform, platform))) error("constraint-platform-conflict", `Explicit platform constraints ${explicit.platforms.join(", ")} do not match ${request.generatorId}.`);
    if (explicit.languages.length > 0 && !explicit.languages.every((language) => valueMatches(policy.implementation.language, language))) error("constraint-language-conflict", `Explicit language constraints ${explicit.languages.join(", ")} do not match ${request.generatorId}.`);
    if (explicit.frameworks.length > 0 && !explicit.frameworks.every((framework) => policy.implementation.frameworks.some((candidate) => valueMatches(candidate, framework)))) error("constraint-framework-conflict", `Explicit framework constraints ${explicit.frameworks.join(", ")} do not match ${request.generatorId}.`);
    for (const version of explicit.versions) {
      const technologyMatches = [policy.id, policy.implementation.language, ...policy.implementation.frameworks].some((candidate) => valueMatches(candidate, version.technology));
      if (technologyMatches && !policy.versions.supported.includes(version.version)) error("constraint-version-conflict", `Explicit ${version.technology} version ${version.version} is not supported by ${request.generatorId}.`);
    }
    const prohibited = [policy.id, policy.implementation.platform, policy.implementation.language, ...policy.implementation.frameworks, ...policy.constraints.requires];
    for (const prohibition of explicit.prohibitions) if (prohibited.some((candidate) => valueMatches(candidate, prohibition))) error("constraint-prohibition-conflict", `The brief prohibits ${prohibition}, which conflicts with ${request.generatorId}.`);
    return registryValidationResultSchema.parse({ status: violations.some((violation) => violation.severity === "error") ? "review-required" : "passed", generatorId: request.generatorId, registryVersion, policyHash: policy.policyHash, authorizedPolicy: violations.length === 0 ? policy : null, violations });
  }

  getAuthorizedOptions(filters: RegistryFilters = {}): GeneratorDiscoveryOption[] {
    return [...this.definitions.values()]
      .filter((generator) => this.isSupported(generator.stackId))
      .filter((generator) => !filters.generatorIds || filters.generatorIds.includes(generator.stackId))
      .filter((generator) => !filters.platform || valueMatches(generator.policy.implementation.platform, filters.platform))
      .filter((generator) => !filters.language || valueMatches(generator.policy.implementation.language, filters.language))
      .filter((generator) => !filters.framework || generator.policy.implementation.frameworks.some((framework) => valueMatches(framework, filters.framework ?? "")))
      .filter((generator) => !filters.lifecycleStatuses || filters.lifecycleStatuses.includes(generator.policy.lifecycle.status))
      .filter((generator) => !filters.requiredCapabilities || filters.requiredCapabilities.every((required) => generator.policy.implementation.capabilities.includes(required)))
      .filter((generator) => !filters.explicitConstraints || this.validateRequest({ generatorId: generator.stackId, explicitConstraints: filters.explicitConstraints, registryVersion: this.registryVersion(), policyHash: generator.policy.policyHash }).status === "passed")
      .map(discoveryOption);
  }
  discoveryCandidates(brief: string, constraints?: ConstraintHints): RegistryDiscoveryCandidate[] {
    const allGenerators = [...this.definitions.values()];
    const compatible = constraints && constraints.unrecognizedMentions.length > 0
      ? []
      : constraints ? allGenerators.filter((generator) => generator.validateConstraints(constraints).status === "passed") : allGenerators;
    return compatible
      .map((generator) => ({ option: discoveryOption(generator), evidence: generator.classify(brief, constraints) }))
      .sort((left, right) => right.evidence.confidence - left.evidence.confidence || right.evidence.semanticIntegrity - left.evidence.semanticIntegrity);
  }
  discoverySlice(brief: string, constraints?: ConstraintHints, limit = 3): RegistryDiscoveryCandidate[] { return this.discoveryCandidates(brief, constraints).slice(0, limit); }
  classify(brief: string, constraints?: ConstraintHints): Classification {
    const allGenerators = [...this.definitions.values()];
    const compatibleGenerators = constraints && constraints.unrecognizedMentions.length > 0
      ? []
      : constraints ? allGenerators.filter((generator) => generator.validateConstraints(constraints).status === "passed") : allGenerators;
    const ranked = (compatibleGenerators.length > 0 ? compatibleGenerators : allGenerators)
      .map((generator) => generator.classify(brief, constraints))
      .sort((left, right) => right.confidence - left.confidence || right.semanticIntegrity - left.semanticIntegrity);
    const top = ranked[0] ?? { recommendedStackId: "unknown", recommendedDomain: "unknown", recommendedPlatform: "unknown", intentSignals: [], architecturalRequirements: [], confidence: 0, semanticIntegrity: 0, conflicts: [], alternatives: [], classifierVersion: "registry-v2-signal-logic" };
    const second = ranked[1];
    const reasons: string[] = [];
    if (constraints && constraints.unrecognizedMentions.length > 0) reasons.push(`Unrecognized technology mentions require review: ${constraints.unrecognizedMentions.join(", ")}.`);
    if (constraints && compatibleGenerators.length === 0) {
      const requested = [...constraints.platforms, ...constraints.languages, ...constraints.frameworks];
      if (requested.length > 0) reasons.push(`No registered generator satisfies the requested constraints: ${requested.join(", ")}.`);
      if (constraints.prohibitions.length > 0) reasons.push(`The requested prohibitions exclude every registered generator: ${constraints.prohibitions.join(", ")}.`);
    }
    if (constraints && compatibleGenerators.length > 0) {
      const selected = this.get(top.recommendedStackId);
      if (selected) reasons.push(...selected.validateConstraints(constraints).errors);
    }
    if (top.confidence < CONFIDENCE_THRESHOLD) reasons.push("Classification confidence is below the safety threshold.");
    if (top.semanticIntegrity < SEMANTIC_INTEGRITY_THRESHOLD) reasons.push("Classification semantic integrity is below the safety threshold.");
    if (top.conflicts.length > 0) reasons.push(...top.conflicts.map((conflict) => `Conflicting intent: ${conflict}`));
    if (second && top.confidence - second.confidence < ALTERNATIVE_MARGIN) reasons.push("Classification alternatives are too close to route safely.");
    if (!this.definitions.has(top.recommendedStackId)) reasons.push("The recommended stack is not registered.");
    const evidence = { ...top, alternatives: ranked.slice(1).map((candidate) => ({ stackId: candidate.recommendedStackId, domain: candidate.recommendedDomain, confidence: candidate.confidence })) };
    return { status: reasons.length > 0 ? "review-required" : "classified", evidence, reasons };
  }
}

export function generateCodexPrompt(blueprint: BlueprintInput): string {
  const list = (items: string[]) => items && items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- None specified";
  const techConstraints = blueprint.technicalConstraints ? list(blueprint.technicalConstraints) : "- None specified";
  return [
    "You are an expert product manager and software architect.",
    "Your task is to generate a comprehensive, professional Product Requirement Document (PRD.md) based on the project specification below.",
    "",
    "### [CONTEXT_BLOCK: IDENTITY]",
    `- Project Name: ${blueprint.name}`,
    `- Description: ${blueprint.description}`,
    `- Target Path: ${blueprint.targetPath}`,
    "",
    "### [CONTEXT_BLOCK: SPECIFICATION]",
    `- Project Scope & Goals: ${blueprint.architectureOverview}`,
    `- Target Audience & Use Cases: ${blueprint.coreLogic}`,
    `- Document Layout: ${blueprint.layoutDesign}`,
    `- Dependencies: ${list(blueprint.dependencies)}`,
    "",
    "### [CONTEXT_BLOCK: CONSTRAINTS]",
    `- Technical Constraints: ${techConstraints}`,
    `- Comments & Extra Context: ${list(blueprint.constraints)}`,
    "",
    "## Output Requirements",
    "Generate only the complete, raw content of `PRD.md` in clean markdown format.",
    "The document should have standard sections: Executive Summary, Scope, User Personas, Core Use Cases, Technical Architecture & Constraints, and Success Metrics.",
    "Do not wrap your output in a markdown block, just output the raw markdown text."
  ].join("\n");
}

export function generateContextSummary(blueprint: BlueprintInput): string {
  const list = (items: string[]) => items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- None specified";
  return [
    `# ${blueprint.name}`,
    "",
    blueprint.description,
    "",
    "## Scope",
    blueprint.architectureOverview,
    "",
    "## Primary users and use cases",
    blueprint.coreLogic,
    "",
    "## Constraints",
    `- Technical: ${blueprint.technicalConstraints?.join("; ") || "None specified"}`,
    `- Additional: ${blueprint.constraints.join("; ") || "None specified"}`,
    "",
    "## Dependencies",
    list(blueprint.dependencies)
  ].join("\n");
}

export function generateCoreDocumentPrompt(prdText: string, filename: CoreDocumentFilename): string {
  return [
    "You are an expert technical writer and software architect.",
    `Generate only the complete raw Markdown content for ${filename}.`,
    "The PRD below is the primary system context and immutable architectural source of truth. Do not invent a different product, stack, or scope.",
    "",
    "### [CONTEXT_BLOCK: IDENTITY]",
    `- Target document: ${filename}`,
    "- Source: PRD.md",
    "",
    "### [CONTEXT_BLOCK: SPECIFICATION]",
    "The generated document must be internally consistent with the PRD and useful to an engineer implementing the approved project.",
    "",
    "### [CONTEXT_BLOCK: CONSTRAINTS]",
    "- Preserve every explicit PRD constraint.",
    "- Do not include secrets or pretend that files were written to the repository.",
    "- Output only the requested document content.",
    "",
    "## PRIMARY SYSTEM CONTEXT: PRD.md",
    prdText
  ].join("\n");
}
