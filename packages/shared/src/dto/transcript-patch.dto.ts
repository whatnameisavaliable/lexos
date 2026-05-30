import { z } from "zod";

/** 润色文稿最大长度（Postgres `TEXT` 合理上限，防滥用）。 */
export const POLISHED_TEXT_MAX_LENGTH = 5_000_000;

/**
 * `PATCH /api/transcription/tasks/:id/transcript` 请求体（`architecture.md` §6.5）。
 *
 * 编辑模式**唯一**可写字段为 `polishedText`；禁止通过此接口修改 `asr_raw_json`。
 */
export const transcriptPatchBodySchema = z.object({
  polishedText: z
    .string()
    .max(POLISHED_TEXT_MAX_LENGTH, {
      message: `polishedText must not exceed ${POLISHED_TEXT_MAX_LENGTH} characters`,
    }),
});

/** 文稿 PATCH 请求 DTO（解析后）。 */
export type TranscriptPatchBody = z.infer<typeof transcriptPatchBodySchema>;

/**
 * 解析并校验文稿 PATCH 请求体；失败抛出 `ZodError`。
 */
export function parseTranscriptPatchBody(input: unknown): TranscriptPatchBody {
  return transcriptPatchBodySchema.parse(input);
}

/**
 * 解析 `If-Match` 请求头中的乐观锁版本号。
 *
 * @throws {Error} 缺失或非正整数时
 */
export function parseTranscriptIfMatchHeader(
  ifMatch: string | undefined | null,
): number {
  if (ifMatch == null || ifMatch.trim() === "") {
    throw new Error("If-Match header is required");
  }
  const trimmed = ifMatch.trim();
  const version = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(version) || version < 1) {
    throw new Error("If-Match must be a positive integer version");
  }
  return version;
}
