import { architecturePacketSchema, architectureSynthesisContextSchema, type ArchitecturePacket, type ArchitectureSynthesisContext, type BlueprintInput, type Classification, type ClassificationEvidence, type ValidationReport } from "@the-vault/shared";

export type GeneratorId = "swift-spritekit" | "python-flet" | "react-typescript";
export type DomainProfile = "mobile-physics" | "desktop-ui" | "web-dashboard";
export type SignalCategory = "language" | "framework" | "platform" | "domain" | "supporting";

export type SignalRule = { id: string; phrases: string[]; weight: number; category: SignalCategory };
export type ConflictRule = { id: string; phrases: string[]; reason: string };

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

export type GeneratorDefinition = GeneratorCapability & {
  version: string;
  signalRules: SignalRule[];
  conflictRules: ConflictRule[];
  language: string;
  frameworkOptions: string[];
  constraints: string[];
  prohibitedSubstitutions: string[];
  classify(brief: string): ClassificationEvidence;
  buildInstruction(): string;
  createPacket(brief: string, blueprint: BlueprintInput, evidence: ClassificationEvidence): ArchitecturePacket;
  validateClassification(evidence: ClassificationEvidence): ValidationReport;
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
  return value.toLocaleLowerCase().normalize("NFKC").replace(/[^a-z0-9+#]+/g, " ").trim().split(/\s+/).filter(Boolean);
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

function contextFor(config: Omit<GeneratorDefinition, "classify" | "buildInstruction" | "createPacket" | "validateClassification" | "validatePacket" | "synthesisContext">): ArchitectureSynthesisContext {
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

function evidenceFor(config: GeneratorDefinition, brief: string): ClassificationEvidence {
  const tokens = tokenize(brief);
  const matchedRules = config.signalRules.filter((rule) => ruleMatches(tokens, rule));
  const conflicts = config.conflictRules.filter((rule) => ruleMatches(tokens, rule)).map((rule) => rule.reason);
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

function definition(config: Omit<GeneratorDefinition, "classify" | "buildInstruction" | "createPacket" | "validateClassification" | "validatePacket" | "synthesisContext">): GeneratorDefinition {
  const synthesisContext = contextFor(config);
  return {
    ...config,
    synthesisContext,
    classify: (brief) => evidenceFor({ ...config, synthesisContext } as GeneratorDefinition, brief),
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
    validatePacket: (packet) => validatePacketFor({ ...config, synthesisContext } as GeneratorDefinition, packet)
  };
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
  listCapabilities(): GeneratorCapability[] { return [...this.definitions.values()].map(({ version: _version, signalRules: _signals, conflictRules: _conflicts, classify: _classify, buildInstruction: _build, createPacket: _packet, validateClassification: _classification, validatePacket: _validate, ...capability }) => capability); }
  get(stackId: string): GeneratorDefinition | undefined { return this.definitions.get(stackId); }
  classify(brief: string): Classification {
    const ranked = [...this.definitions.values()].map((generator) => generator.classify(brief)).sort((left, right) => right.confidence - left.confidence || right.semanticIntegrity - left.semanticIntegrity);
    const top = ranked[0] ?? { recommendedStackId: "unknown", recommendedDomain: "unknown", recommendedPlatform: "unknown", intentSignals: [], architecturalRequirements: [], confidence: 0, semanticIntegrity: 0, conflicts: [], alternatives: [], classifierVersion: "registry-v2-signal-logic" };
    const second = ranked[1];
    const reasons: string[] = [];
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
  const list = (items: string[]) => items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- None specified";
  return ["# Codex Implementation Brief", "", "Implement the following component while preserving every stated constraint.", "", "## Component", `Name: ${blueprint.name}`, `Target path: ${blueprint.targetPath}`, `Language: ${blueprint.language}`, `Framework: ${blueprint.framework}`, "", "## Description", blueprint.description, "", "## Architecture overview", blueprint.architectureOverview, "", "## Core logic", blueprint.coreLogic, "", "## Layout and UI design", blueprint.layoutDesign, "", "## Dependencies", list(blueprint.dependencies), "", "## Constraints", list(blueprint.constraints), "", "## Required response", "1. Summarize the implementation approach.", "2. List the files to create or modify.", "3. Provide the implementation artifact or patch.", "4. Explain how each constraint is preserved.", "5. State verification steps and any unresolved assumptions.", "", "Do not expand scope, add dependencies, or change public contracts without calling it out explicitly."].join("\n");
}
