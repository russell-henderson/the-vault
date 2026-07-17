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
export const briefInputSchema = z.object({ brief: nonEmpty.max(8000), provider: z.enum(["configured", "mock"]).default("configured"), analysis: providerSelectionSchema.optional() });
export const blueprintProposalSchema = z.object({
  blueprint: blueprintInputSchema,
  plan: implementationPlanSchema,
  warnings: z.array(nonEmpty.max(1000)).max(20),
  provider: providerMetadataSchema,
  classification: classificationSchema.optional(),
  architecturePacket: architecturePacketSchema.optional(),
  validation: validationReportSchema.optional()
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
export type StackId = z.infer<typeof stackIdSchema>;
export type ArchitectureSynthesisContext = z.infer<typeof architectureSynthesisContextSchema>;
export type ClassificationEvidence = z.infer<typeof classificationEvidenceSchema>;
export type Classification = z.infer<typeof classificationSchema>;
export type ArchitecturePacket = z.infer<typeof architecturePacketSchema>;
export type DynamicComponent = z.infer<typeof dynamicComponentSchema>;
export type ProvenanceRecord = z.infer<typeof provenanceRecordSchema>;
export type ValidationReport = z.infer<typeof validationReportSchema>;
export type PromptArtifact = z.infer<typeof promptArtifactSchema>;
export type ExecutionRecord = z.infer<typeof executionRecordSchema>;
export type ExecutionStatus = z.infer<typeof executionStatusSchema>;
export type VerificationInput = z.infer<typeof verificationInputSchema>;
export type ExecutionCreateInput = z.infer<typeof executionCreateSchema>;
