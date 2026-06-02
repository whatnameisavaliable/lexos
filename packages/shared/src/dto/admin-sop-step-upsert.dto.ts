import { z } from "zod";
import {
  SOP_EXECUTION_TYPE_VALUES,
  SopExecutionType,
} from "../enums/sop-execution-type.js";
import {
  SOP_AI_FEATURE_KEY_VALUES,
  type SopAiFeatureKey,
} from "../enums/sop-ai-feature-keys.js";

const stepCodeSchema = z
  .string()
  .trim()
  .min(1, "stepCode is required")
  .max(32, "stepCode must be at most 32 characters");

const stepNameSchema = z
  .string()
  .trim()
  .min(1, "name is required")
  .max(256, "name must be at most 256 characters");

const executionTypeSchema = z.enum(
  SOP_EXECUTION_TYPE_VALUES as [
    SopExecutionType,
    ...SopExecutionType[],
  ],
  { message: "executionType must be a valid SOP execution type" },
);

const sopAiFeatureKeys = [
  ...SOP_AI_FEATURE_KEY_VALUES,
] as unknown as [SopAiFeatureKey, ...SopAiFeatureKey[]];

const sopAiFeatureKeySchema = z.enum(sopAiFeatureKeys, {
  message: "aiFeatureKey must be a valid SOP AI feature key",
});

const uuidSchema = z.string().uuid({ message: "promptTemplateId must be a UUID" });

const dependsOnSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, "dependsOn entry must be a non-empty step code")
      .max(32),
  )
  .default([]);

/**
 * 单条 SOP 步骤 upsert 字段（`PUT .../prompts` 与创建模板初始步骤共用）。
 */
export const adminSopStepUpsertSchema = z
  .object({
    stepCode: stepCodeSchema,
    name: stepNameSchema,
    executionType: executionTypeSchema,
    aiFeatureKey: sopAiFeatureKeySchema.optional(),
    promptTemplateId: uuidSchema.optional(),
    inputSchema: z.record(z.string(), z.unknown()).default({}),
    dependsOn: dependsOnSchema,
    requiresVerification: z.boolean().default(false),
  })
  .superRefine((step, ctx) => {
    const needsAi =
      step.executionType === SopExecutionType.SYNC_LLM ||
      step.executionType === SopExecutionType.ASYNC_DEEP_RESEARCH;

    if (needsAi && !step.aiFeatureKey) {
      ctx.addIssue({
        code: "custom",
        message: "aiFeatureKey is required for sync_llm and async_deep_research",
        path: ["aiFeatureKey"],
      });
    }

    if (step.executionType === SopExecutionType.MANUAL && step.aiFeatureKey) {
      ctx.addIssue({
        code: "custom",
        message: "aiFeatureKey must be omitted for manual steps",
        path: ["aiFeatureKey"],
      });
    }
  });

/** 单步 upsert DTO（解析后）。 */
export type AdminSopStepUpsert = z.infer<typeof adminSopStepUpsertSchema>;

/**
 * 解析并校验单条 SOP 步骤；失败抛出 `ZodError`。
 */
export function parseAdminSopStepUpsert(input: unknown): AdminSopStepUpsert {
  return adminSopStepUpsertSchema.parse(input);
}
