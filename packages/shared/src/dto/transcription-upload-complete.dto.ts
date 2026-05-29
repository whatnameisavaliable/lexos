import { z } from "zod";

const uploadSessionIdSchema = z.string().uuid("uploadSessionId must be a UUID");

/**
 * `POST /api/transcription/uploads/complete` 请求体（`architecture.md` §5.5.1）。
 */
export const transcriptionUploadCompleteBodySchema = z.object({
  uploadSessionId: uploadSessionIdSchema,
});

/** TUS 完成回调请求 DTO（解析后）。 */
export interface TranscriptionUploadCompleteBody {
  readonly uploadSessionId: string;
}

/**
 * 解析并校验上传 complete 请求体；失败抛出 `ZodError`。
 */
export function parseTranscriptionUploadCompleteBody(
  input: unknown,
): TranscriptionUploadCompleteBody {
  return transcriptionUploadCompleteBodySchema.parse(input);
}
