import { z } from "zod";

const finalizedArtifactSchema = z.object({
  stepCode: z.string().trim().min(1).max(32),
  contentRaw: z.string(),
});

/**
 * `POST /api/admin/sops/preview-pipeline` 请求体（Admin 沙盒，不写 `case_pipelines`）。
 */
export const adminSopPreviewPipelineBodySchema = z.object({
  templateVersionId: z
    .string()
    .uuid({ message: "templateVersionId must be a UUID" }),
  stepCode: z
    .string()
    .trim()
    .min(1, "stepCode is required")
    .max(32),
  formValues: z.record(z.string(), z.string()).default({}),
  finalizedArtifacts: z.array(finalizedArtifactSchema).default([]),
  sopMediaExtractedText: z.string().default(""),
});

/** Admin 沙盒试跑 DTO（解析后）。 */
export type AdminSopPreviewPipelineBody = z.infer<
  typeof adminSopPreviewPipelineBodySchema
>;

/** 沙盒已定稿上游产出物（与 {@link SopFinalizedArtifactInput} 对齐）。 */
export type AdminSopPreviewFinalizedArtifact = z.infer<
  typeof finalizedArtifactSchema
>;

/**
 * 解析并校验 preview-pipeline 请求体；失败抛出 `ZodError`。
 */
export function parseAdminSopPreviewPipelineBody(
  input: unknown,
): AdminSopPreviewPipelineBody {
  return adminSopPreviewPipelineBodySchema.parse(input);
}
