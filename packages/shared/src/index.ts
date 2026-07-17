import { z } from "zod";

const nonEmpty = z.string().trim().min(1);

export const providerMetadataSchema = z.object({
  name: nonEmpty,
  model: z.string().trim().max(160).optional(),
  fallback: z.boolean().optional(),
  message: z.string().trim().max(1000).optional(),
  durationMs: z.number().int().nonnegative().optional()
});

export const providerKindSchema = z.enum(["ollama", "mock"]);
export const providerSelectionSchema = z.object({
  provider: providerKindSchema,
  model: z.string().trim().max(160).optional()
});
export const providerModelOptionSchema = z.object({
  provider: providerKindSchema,
  model: nonEmpty.max(160),
  label: nonEmpty.max(240),
  available: z.boolean(),
  cloud: z.boolean()
});
export const providerCatalogSchema = z.object({
  configured: z.object({ analysis: providerSelectionSchema, creation: providerSelectionSchema }),
  models: z.array(providerModelOptionSchema),
  ollamaAvailable: z.boolean(),
  detail: z.string(),
  refreshedAt: z.string().datetime()
});

export const stackIdSchema = z.string().trim().min(1).max(120);
export const domainProfileSchema = z.string().trim().min(1).max(120);
export const explicitConstraintsSchema = z.object({
  platforms: z.array(z.enum(["mobile", "desktop", "web"])).max(10),
  languages: z.array(nonEmpty.max(80)).max(20),
  frameworks: z.array(nonEmpty.max(160)).max(20),
  versions: z.array(z.object({ technology: nonEmpty.max(160), version: nonEmpty.max(80) })).max(30),
  prohibitions: z.array(nonEmpty.max(160)).max(50),
  unresolvedMentions: z.array(nonEmpty.max(160)).max(50)
});
export const constraintExtractionSchema = explicitConstraintsSchema.extend({
  stackMentions: z.array(nonEmpty.max(160)).max(50),
  unrecognizedMentions: z.array(nonEmpty.max(160)).max(50),
  tokens: z.array(nonEmpty.max(80)).max(2000)
});
export const discoveryRegistryOptionSchema = z.object({
  stackId: stackIdSchema,
  domainProfile: domainProfileSchema,
  platform: z.enum(["mobile", "desktop", "web"]),
  language: nonEmpty.max(80),
  frameworkOptions: z.array(nonEmpty.max(160)).min(1).max(10),
  supportedIntentSignals: z.array(nonEmpty.max(160)).max(50),
  architecturalTraits: z.array(nonEmpty.max(500)).max(50),
  requiredComponentKinds: z.array(nonEmpty.max(120)).max(50),
  constraints: z.array(nonEmpty.max(1000)).max(50),
  prohibitedSubstitutions: z.array(nonEmpty.max(500)).max(30),
  version: nonEmpty.max(80),
  policyHash: nonEmpty.max(200).optional(),
  lifecycleStatus: z.enum(["supported", "experimental", "deprecated", "disabled"]).optional()
});
export const discoveryRecommendationSchema = z.object({
  stackId: stackIdSchema,
  reason: nonEmpty.max(1000),
  confidence: z.number().min(0).max(1)
});
export const discoveryModelResultSchema = z.object({
  domain: domainProfileSchema.nullable(),
  likelyStackOptions: z.array(discoveryRecommendationSchema).max(3),
  recommendedStackId: stackIdSchema.nullable(),
  missingInfo: z.array(nonEmpty.max(500)).max(20),
  clarifyingQuestions: z.array(nonEmpty.max(1000)).max(3)
});
export const architectureSynthesisContextSchema = z.object({
  stackId: stackIdSchema,
  domainProfile: domainProfileSchema,
  platform: z.enum(["mobile", "desktop", "web"]),
  language: nonEmpty.max(80),
  frameworkOptions: z.array(nonEmpty.max(160)).min(1).max(10),
  requiredComponentKinds: z.array(nonEmpty.max(120)).min(1).max(50),
  architecturalTraits: z.array(nonEmpty.max(500)).max(50),
  constraints: z.array(nonEmpty.max(1000)).max(50),
  prohibitedSubstitutions: z.array(nonEmpty.max(500)).max(30)
});
export const classificationEvidenceSchema = z.object({
  recommendedStackId: stackIdSchema,
  recommendedDomain: domainProfileSchema,
  recommendedPlatform: z.string().trim().min(1).max(80),
  intentSignals: z.array(nonEmpty.max(240)).max(30),
  architecturalRequirements: z.array(nonEmpty.max(500)).max(30),
  confidence: z.number().min(0).max(1),
  semanticIntegrity: z.number().min(0).max(1),
  conflicts: z.array(nonEmpty.max(500)).max(20),
  alternatives: z.array(z.object({ stackId: stackIdSchema, domain: domainProfileSchema, confidence: z.number().min(0).max(1) })).max(10),
  classifierVersion: nonEmpty.max(80)
});
export const classificationSchema = z.object({
  status: z.enum(["classified", "review-required"]),
  evidence: classificationEvidenceSchema,
  reasons: z.array(nonEmpty.max(500)).max(20)
});
export const discoveryResultSchema = z.object({
  status: z.enum(["discovery", "review-required"]),
  domain: domainProfileSchema.nullable(),
  likelyStackOptions: z.array(discoveryRecommendationSchema).max(3),
  suggestedGeneratorId: stackIdSchema.nullable(),
  recommendedStackId: stackIdSchema.nullable(),
  missingInfo: z.array(nonEmpty.max(500)).max(20),
  clarifyingQuestions: z.array(nonEmpty.max(1000)).max(3),
  constraints: constraintExtractionSchema,
  evidence: z.array(classificationEvidenceSchema).max(10),
  registryVersion: nonEmpty.max(80),
  unsupportedDiscoveries: z.array(z.object({ technology: nonEmpty.max(160), reason: nonEmpty.max(1000) })).max(30),
  enrichment: z.object({ sources: z.array(nonEmpty.max(160)).max(20), warnings: z.array(nonEmpty.max(1000)).max(20) }),
  reasons: z.array(nonEmpty.max(1000)).max(30),
  warnings: z.array(nonEmpty.max(1000)).max(20)
});

export const generatorPolicySchema = z.object({
  id: stackIdSchema,
  name: nonEmpty.max(200),
  implementation: z.object({
    platform: nonEmpty.max(80),
    language: nonEmpty.max(80),
    frameworks: z.array(nonEmpty.max(160)).min(1).max(20),
    capabilities: z.array(nonEmpty.max(160)).max(50),
    capabilityFingerprint: z.array(nonEmpty.max(160)).max(50)
  }),
  versions: z.object({ generator: nonEmpty.max(80), supported: z.array(nonEmpty.max(80)).min(1).max(20), default: nonEmpty.max(80).optional() }),
  templates: z.array(z.object({ id: nonEmpty.max(160), supportedVersions: z.array(nonEmpty.max(80)).min(1).max(20), status: z.enum(["supported", "experimental", "deprecated", "disabled"]) })).max(30),
  constraints: z.object({ requires: z.array(nonEmpty.max(500)).max(50), conflicts: z.array(nonEmpty.max(500)).max(50) }),
  lifecycle: z.object({ status: z.enum(["supported", "experimental", "deprecated", "disabled"]) }),
  metadata: z.object({ owner: nonEmpty.max(160).optional(), createdAt: z.string().datetime(), updatedAt: z.string().datetime() }),
  policyHash: nonEmpty.max(200)
});
export const registryValidationRequestSchema = z.object({
  generatorId: stackIdSchema,
  requestedVersion: nonEmpty.max(80).optional(),
  templateId: nonEmpty.max(160).optional(),
  platform: nonEmpty.max(80).optional(),
  language: nonEmpty.max(80).optional(),
  framework: nonEmpty.max(160).optional(),
  requiredCapabilities: z.array(nonEmpty.max(160)).max(50).optional(),
  explicitConstraints: explicitConstraintsSchema,
  registryVersion: nonEmpty.max(80).optional(),
  policyHash: nonEmpty.max(200).optional(),
  allowDeprecated: z.boolean().optional()
});
export const registryValidationResultSchema = z.object({
  status: z.enum(["passed", "review-required"]),
  generatorId: stackIdSchema,
  registryVersion: nonEmpty.max(80),
  policyHash: nonEmpty.max(200),
  authorizedPolicy: generatorPolicySchema.nullable(),
  violations: z.array(z.object({ code: nonEmpty.max(120), message: nonEmpty.max(1000), severity: z.enum(["error", "warning"]) })).max(50)
});
export const authorizationProvenanceSchema = z.object({
  requestId: nonEmpty.max(200),
  generatorId: stackIdSchema,
  generatorVersion: nonEmpty.max(80),
  templateId: nonEmpty.max(160).optional(),
  registryVersion: nonEmpty.max(80),
  policyHash: nonEmpty.max(200),
  orchestratorVersion: nonEmpty.max(80),
  validationStatus: z.literal("passed"),
  discoveryUsed: z.boolean(),
  enrichmentSources: z.array(nonEmpty.max(160)).max(20),
  confirmedByUser: z.literal(true),
  createdAt: z.string().datetime()
});
export const authorizedSynthesisContextSchema = z.object({
  confirmedBrief: nonEmpty.max(8000),
  generatorPolicy: generatorPolicySchema,
  validatedConstraints: explicitConstraintsSchema,
  registryVersion: nonEmpty.max(80),
  policyHash: nonEmpty.max(200),
  provenance: authorizationProvenanceSchema
});
export const enrichmentResultSchema = z.object({
  domain: domainProfileSchema.nullable(),
  suggestedGeneratorIds: z.array(stackIdSchema).max(10),
  observations: z.array(nonEmpty.max(1000)).max(30),
  missingInfo: z.array(nonEmpty.max(500)).max(20),
  clarifyingQuestions: z.array(nonEmpty.max(1000)).max(10),
  unsupportedDiscoveries: z.array(z.object({ technology: nonEmpty.max(160), reason: nonEmpty.max(1000) })).max(30),
  sources: z.array(nonEmpty.max(160)).max(20),
  warnings: z.array(nonEmpty.max(1000)).max(20)
});
export const packetFieldSchema = z.object({ name: nonEmpty.max(120), type: nonEmpty.max(160), description: z.string().trim().max(500) });
export const dynamicComponentSchema = z.object({
  id: nonEmpty.max(120),
  kind: nonEmpty.max(120),
  name: nonEmpty.max(160),
  responsibility: nonEmpty.max(2000),
  inputs: z.array(packetFieldSchema).max(30),
  outputs: z.array(packetFieldSchema).max(30),
  dependencies: z.array(nonEmpty.max(160)).max(30),
  constraints: z.array(nonEmpty.max(500)).max(30)
});
export const architectureLayerSchema = z.object({ id: nonEmpty.max(120), name: nonEmpty.max(160), purpose: nonEmpty.max(1000), componentIds: z.array(nonEmpty.max(120)).max(30) });
export const dataFlowSchema = z.object({ fromComponentId: nonEmpty.max(120), toComponentId: nonEmpty.max(120), data: nonEmpty.max(500), direction: z.enum(["input", "output", "event", "persistence"]) });
export const provenanceRecordSchema = z.object({
  id: nonEmpty,
  nodeId: nonEmpty,
  nodeType: z.enum(["brief", "classification", "generator", "packet", "blueprint", "prompt", "execution", "artifact", "verification", "export"]),
  parentIds: z.array(nonEmpty.max(200)).max(20),
  rootId: nonEmpty,
  contentHash: nonEmpty.max(200),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime()
});
export const architecturePacketSchema = z.object({
  packetVersion: z.literal("2"),
  packetId: nonEmpty,
  stack: z.object({ id: stackIdSchema, language: nonEmpty.max(80), framework: nonEmpty.max(160), platform: nonEmpty.max(80), domainProfile: domainProfileSchema }),
  intent: z.object({ summary: nonEmpty.max(4000), signals: z.array(nonEmpty.max(240)).max(30), architecturalRequirements: z.array(nonEmpty.max(500)).max(30) }),
  component: z.object({ name: nonEmpty.max(160), purpose: nonEmpty.max(2000), targetPath: z.string().trim().max(500).optional() }),
  components: z.array(dynamicComponentSchema).min(1).max(50),
  architecture: z.object({ layers: z.array(architectureLayerSchema).max(30), dataFlows: z.array(dataFlowSchema).max(50), constraints: z.array(nonEmpty.max(500)).max(50), dependencies: z.array(nonEmpty.max(160)).max(50) }),
  validation: z.object({ status: z.enum(["passed", "failed"]), generatorVersion: nonEmpty.max(80), errors: z.array(nonEmpty.max(500)).max(30), warnings: z.array(nonEmpty.max(500)).max(30) }),
  provenance: provenanceRecordSchema
});
export const validationReportSchema = z.object({ status: z.enum(["passed", "failed", "review-required"]), errors: z.array(nonEmpty.max(500)).max(30), warnings: z.array(nonEmpty.max(500)).max(30) });

export const implementationPlanSchema = z.object({
  summary: nonEmpty.max(2000),
  steps: z.array(nonEmpty.max(1000)).max(20),
  filesToTouch: z.array(nonEmpty.max(500)).max(50),
  assumptions: z.array(nonEmpty.max(1000)).max(20),
  acceptanceCriteria: z.array(nonEmpty.max(1000)).max(30)
});

export const blueprintInputSchema = z.object({
  name: nonEmpty.max(120),
  description: nonEmpty.max(4000),
  targetPath: nonEmpty.max(500),
  language: nonEmpty.max(80),
  framework: nonEmpty.max(120),
  dependencies: z.array(nonEmpty.max(160)).max(50),
  architectureOverview: nonEmpty.max(4000),
  coreLogic: nonEmpty.max(4000),
  layoutDesign: nonEmpty.max(4000),
  constraints: z.array(nonEmpty.max(1000)).max(50),
  implementationPlan: implementationPlanSchema.optional(),
  architecturePacket: architecturePacketSchema.optional(),
  source: z.enum(["human", "ollama", "mock"]).optional(),
  sourceBrief: z.string().trim().max(8000).optional()
});

export const blueprintSchema = blueprintInputSchema.extend({
  id: nonEmpty,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const promptArtifactSchema = z.object({
  id: nonEmpty,
  blueprintId: nonEmpty,
  generatedPrompt: nonEmpty,
  version: z.number().int().positive(),
  createdAt: z.string().datetime()
});

export const executionStatusSchema = z.enum(["pending", "running", "completed", "failed", "needs-review"]);
export const executionRecordSchema = z.object({
  id: nonEmpty,
  blueprintId: nonEmpty,
  promptArtifactId: nonEmpty,
  status: executionStatusSchema,
  inputPrompt: z.string(),
  generatedOutput: z.string(),
  artifactType: z.string(),
  artifactLocation: z.string(),
  outputLocation: z.string(),
  verificationNotes: z.string(),
  provider: providerMetadataSchema.optional(),
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable()
});

export const verificationInputSchema = z.object({ verificationNotes: nonEmpty.max(4000) });
export const executionCreateSchema = z.object({ promptArtifactId: nonEmpty, provider: z.enum(["configured", "mock"]).default("configured"), creation: providerSelectionSchema.optional() });
export const briefInputSchema = z.object({ brief: nonEmpty.max(8000), provider: z.enum(["configured", "mock"]).default("configured"), analysis: providerSelectionSchema.optional(), generatorId: stackIdSchema.optional(), discovery: z.unknown().optional() });
export const discoveryInputSchema = z.object({ brief: nonEmpty.max(8000), analysis: providerSelectionSchema.optional(), provider: z.enum(["configured", "mock"]).default("configured") });
export const blueprintProposalSchema = z.object({
  blueprint: blueprintInputSchema,
  plan: implementationPlanSchema,
  warnings: z.array(nonEmpty.max(1000)).max(20),
  provider: providerMetadataSchema,
  classification: classificationSchema.optional(),
  architecturePacket: architecturePacketSchema.optional(),
  validation: validationReportSchema.optional(),
  packet: architecturePacketSchema.optional(),
  status: z.enum(["validated", "review-required"]).optional(),
  provenance: z.object({ registryVersion: nonEmpty.max(80), discoveryUsed: z.boolean(), selectedFromDiscovery: stackIdSchema.nullable(), confirmedByUser: z.boolean(), requestId: nonEmpty.max(200).optional(), generatorId: stackIdSchema.optional(), generatorVersion: nonEmpty.max(80).optional(), templateId: nonEmpty.max(160).optional(), policyHash: nonEmpty.max(200).optional(), orchestratorVersion: nonEmpty.max(80).optional(), validationStatus: z.literal("passed").optional(), enrichmentSources: z.array(nonEmpty.max(160)).max(20).optional(), createdAt: z.string().datetime().optional() }).optional(),
  reasons: z.array(nonEmpty.max(1000)).max(30).optional()
});
export const providerStatusSchema = z.object({
  configured: providerMetadataSchema,
  available: z.boolean(),
  detail: z.string(),
  fallbackAvailable: z.boolean(),
  models: z.object({ analysis: nonEmpty, creation: nonEmpty }).optional(),
  ollamaAvailable: z.boolean().optional(),
  catalogRefreshedAt: z.string().datetime().optional()
});

export type BlueprintInput = z.infer<typeof blueprintInputSchema>;
export type Blueprint = z.infer<typeof blueprintSchema>;
export type ImplementationPlan = z.infer<typeof implementationPlanSchema>;
export type BlueprintProposal = z.infer<typeof blueprintProposalSchema>;
export type BriefInput = z.infer<typeof briefInputSchema>;
export type ProviderMetadata = z.infer<typeof providerMetadataSchema>;
export type ProviderKind = z.infer<typeof providerKindSchema>;
export type ProviderSelection = z.infer<typeof providerSelectionSchema>;
export type ProviderModelOption = z.infer<typeof providerModelOptionSchema>;
export type ProviderCatalog = z.infer<typeof providerCatalogSchema>;
export type ProviderStatus = z.infer<typeof providerStatusSchema>;
export type ConstraintExtraction = z.infer<typeof constraintExtractionSchema>;
export type ExplicitConstraints = z.infer<typeof explicitConstraintsSchema>;
export type DiscoveryRegistryOption = z.infer<typeof discoveryRegistryOptionSchema>;
export type DiscoveryRecommendation = z.infer<typeof discoveryRecommendationSchema>;
export type DiscoveryModelResult = z.infer<typeof discoveryModelResultSchema>;
export type DiscoveryInput = z.infer<typeof discoveryInputSchema>;
export type StackId = z.infer<typeof stackIdSchema>;
export type ArchitectureSynthesisContext = z.infer<typeof architectureSynthesisContextSchema>;
export type ClassificationEvidence = z.infer<typeof classificationEvidenceSchema>;
export type Classification = z.infer<typeof classificationSchema>;
export type DiscoveryResult = z.infer<typeof discoveryResultSchema>;
export type GeneratorPolicy = z.infer<typeof generatorPolicySchema>;
export type RegistryValidationRequest = z.infer<typeof registryValidationRequestSchema>;
export type RegistryValidationResult = z.infer<typeof registryValidationResultSchema>;
export type AuthorizationProvenance = z.infer<typeof authorizationProvenanceSchema>;
export type AuthorizedSynthesisContext = z.infer<typeof authorizedSynthesisContextSchema>;
export type EnrichmentResult = z.infer<typeof enrichmentResultSchema>;
export type ArchitecturePacket = z.infer<typeof architecturePacketSchema>;
export type DynamicComponent = z.infer<typeof dynamicComponentSchema>;
export type ProvenanceRecord = z.infer<typeof provenanceRecordSchema>;
export type ValidationReport = z.infer<typeof validationReportSchema>;
export type PromptArtifact = z.infer<typeof promptArtifactSchema>;
export type ExecutionRecord = z.infer<typeof executionRecordSchema>;
export type ExecutionStatus = z.infer<typeof executionStatusSchema>;
export type VerificationInput = z.infer<typeof verificationInputSchema>;
export type ExecutionCreateInput = z.infer<typeof executionCreateSchema>;
