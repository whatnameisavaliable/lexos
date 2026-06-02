import { z } from "zod";
import {
  ALLOWED_TRANSCRIPTION_MIME_TYPES,
  MAX_DURATION_SEC,
  MAX_SIZE_BYTES,
} from "../lib/transcription-limits.js";

const pipelineIdSchema = z.string().uuid({ message: "pipelineId must be a UUID" });
const fileNameSchema = z.string().trim().min(1).max(512);
const mimeTypeSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .refine(
    (value) =>
      (ALLOWED_TRANSCRIPTION_MIME_TYPES as readonly string[]).includes(
        value.toLowerCase(),
      ),
    { message: "mimeType is not an allowed SOP media format" },
  );
const sizeBytesSchema = z.coerce
  .bigint()
  .refine((value) => value > 0n, { message: "sizeBytes must be positive" })
  .refine((value) => value <= BigInt(MAX_SIZE_BYTES), {
    message: `sizeBytes must not exceed ${MAX_SIZE_BYTES}`,
  });
const durationSecSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(MAX_DURATION_SEC);

/**
 * `POST /api/sops/uploads/init` 请求体（`prd.md` §3.8.4 · 限额同 §3.5.1）。
 */
export const sopUploadInitBodySchema = z.object({
  pipelineId: pipelineIdSchema,
  fileName: fileNameSchema,
  mimeType: mimeTypeSchema,
  sizeBytes: sizeBytesSchema,
  durationSec: durationSecSchema.optional(),
});

/** SOP 卷宗上传 init 请求 DTO（解析后）。 */
export interface SopUploadInitBody {
  readonly pipelineId: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly sizeBytes: bigint;
  readonly durationSec?: number;
}

/**
 * 解析并校验 SOP 卷宗上传 init 请求体；失败抛出 `ZodError`。
 */
export function parseSopUploadInitBody(input: unknown): SopUploadInitBody {
  const parsed = sopUploadInitBodySchema.parse(input);
  return {
    pipelineId: parsed.pipelineId,
    fileName: parsed.fileName,
    mimeType: parsed.mimeType.toLowerCase(),
    sizeBytes: parsed.sizeBytes,
    durationSec: parsed.durationSec,
  };
}
