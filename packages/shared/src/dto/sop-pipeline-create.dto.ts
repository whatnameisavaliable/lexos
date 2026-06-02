import { z } from "zod";

const templateVersionIdSchema = z
  .string()
  .uuid({ message: "templateVersionId must be a UUID" });

/**
 * `POST /api/sops/pipelines` 请求体（`prd.md` §3.8.1 · `architecture.md` §7）。
 */
export const sopPipelineCreateBodySchema = z.object({
  templateVersionId: templateVersionIdSchema,
});

/** 创建案件流水线请求 DTO（解析后）。 */
export interface SopPipelineCreateBody {
  readonly templateVersionId: string;
}

/**
 * 解析并校验创建流水线请求体；失败抛出 `ZodError`。
 */
export function parseSopPipelineCreateBody(
  input: unknown,
): SopPipelineCreateBody {
  return sopPipelineCreateBodySchema.parse(input);
}
