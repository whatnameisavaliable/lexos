import { z } from "zod";

const uploadSessionIdSchema = z.string().uuid("uploadSessionId must be a UUID");

/**
 * `POST /api/sops/uploads/complete` 请求体（`prd.md` §3.8.4）。
 */
export const sopUploadCompleteBodySchema = z.object({
  uploadSessionId: uploadSessionIdSchema,
});

/** SOP 卷宗 TUS 完成回调请求 DTO（解析后）。 */
export interface SopUploadCompleteBody {
  readonly uploadSessionId: string;
}

/**
 * 解析并校验 SOP 上传 complete 请求体；失败抛出 `ZodError`。
 */
export function parseSopUploadCompleteBody(
  input: unknown,
): SopUploadCompleteBody {
  return sopUploadCompleteBodySchema.parse(input);
}
