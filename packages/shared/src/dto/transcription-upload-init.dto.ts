import { z } from "zod";
import {
  ALLOWED_TRANSCRIPTION_MIME_TYPES,
  MAX_DURATION_SEC,
  MAX_SIZE_BYTES,
} from "../lib/transcription-limits.js";

const titleSchema = z.string().trim().min(1).max(256);
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
    { message: "mimeType is not an allowed transcription source format" },
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
const idempotencyKeySchema = z.string().trim().min(1).max(128);

/**
 * `POST /api/transcription/uploads/init` 请求体（`prd.md` §3.5.1 · `architecture.md` §5.5.1）。
 */
export const transcriptionUploadInitBodySchema = z.object({
  title: titleSchema,
  fileName: fileNameSchema,
  mimeType: mimeTypeSchema,
  sizeBytes: sizeBytesSchema,
  durationSec: durationSecSchema.optional(),
  idempotencyKey: idempotencyKeySchema.optional(),
});

/** 上传初始化请求 DTO（解析后）。 */
export interface TranscriptionUploadInitBody {
  readonly title: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly sizeBytes: bigint;
  readonly durationSec?: number;
  readonly idempotencyKey?: string;
}

/**
 * 解析并校验上传 init 请求体；失败抛出 `ZodError`。
 */
export function parseTranscriptionUploadInitBody(
  input: unknown,
): TranscriptionUploadInitBody {
  const parsed = transcriptionUploadInitBodySchema.parse(input);
  return {
    title: parsed.title,
    fileName: parsed.fileName,
    mimeType: parsed.mimeType.toLowerCase(),
    sizeBytes: parsed.sizeBytes,
    durationSec: parsed.durationSec,
    idempotencyKey: parsed.idempotencyKey,
  };
}
