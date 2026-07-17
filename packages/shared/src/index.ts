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
  provider: providerMetadataSchema
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
export type PromptArtifact = z.infer<typeof promptArtifactSchema>;
export type ExecutionRecord = z.infer<typeof executionRecordSchema>;
export type ExecutionStatus = z.infer<typeof executionStatusSchema>;
export type VerificationInput = z.infer<typeof verificationInputSchema>;
export type ExecutionCreateInput = z.infer<typeof executionCreateSchema>;
