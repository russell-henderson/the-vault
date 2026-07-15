import { z } from "zod";

const nonEmpty = z.string().trim().min(1);

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
  constraints: z.array(nonEmpty.max(1000)).max(50)
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
  outputLocation: z.string(),
  verificationNotes: z.string(),
  createdAt: z.string().datetime()
});

export type BlueprintInput = z.infer<typeof blueprintInputSchema>;
export type Blueprint = z.infer<typeof blueprintSchema>;
export type PromptArtifact = z.infer<typeof promptArtifactSchema>;
export type ExecutionRecord = z.infer<typeof executionRecordSchema>;
export type ExecutionStatus = z.infer<typeof executionStatusSchema>;
