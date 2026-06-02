import { z } from "zod";

/**
 * `PATCH /api/sops/artifacts/:id` 请求体（`prd.md` §3.9.3）。
 * `contentRaw` 允许空串：律师可在 `draft` 阶段清空草稿内容（PRD 未禁止空内容）。
 */
export const sopArtifactPatchBodySchema = z.object({
  contentRaw: z.string(),
});

/** 产出物 PATCH 请求 DTO（解析后）。 */
export interface SopArtifactPatchBody {
  readonly contentRaw: string;
}

/**
 * 解析并校验产出物 PATCH 请求体；失败抛出 `ZodError`。
 */
export function parseSopArtifactPatchBody(
  input: unknown,
): SopArtifactPatchBody {
  return sopArtifactPatchBodySchema.parse(input);
}
