import { z } from "zod";

/** `POST /api/transcription/tasks/:id/retry` 重试范围（PRD-3.5-06 / §3.5.08）。 */
export const transcriptionTaskRetryScopeSchema = z.enum([
  "pipeline",
  "polish",
  "summary",
]);

export type TranscriptionTaskRetryScope = z.infer<
  typeof transcriptionTaskRetryScopeSchema
>;

export const transcriptionTaskRetryBodySchema = z.object({
  scope: transcriptionTaskRetryScopeSchema,
});

export type TranscriptionTaskRetryBody = z.infer<
  typeof transcriptionTaskRetryBodySchema
>;

export function parseTranscriptionTaskRetryBody(
  input: unknown,
): TranscriptionTaskRetryBody {
  return transcriptionTaskRetryBodySchema.parse(input);
}
