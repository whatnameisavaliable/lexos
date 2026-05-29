import { z } from "zod";
import { MAX_PAGE_LIMIT, parseLimit } from "../api/pagination.js";
import {
  TRANSCRIPTION_TASK_STATUS_VALUES,
  type TranscriptionTaskStatus,
} from "../enums/transcription-task-status.js";

const statusFilterSchema = z.enum(
  [...TRANSCRIPTION_TASK_STATUS_VALUES] as [
    TranscriptionTaskStatus,
    ...TranscriptionTaskStatus[],
  ],
);

/**
 * `GET /api/transcription/tasks` 查询参数（camelCase 经 Controller 映射）。
 */
export const transcriptionTaskListQuerySchema = z
  .object({
    limit: z.union([z.string(), z.number()]).optional(),
    cursor: z.string().trim().min(1).optional(),
    status: statusFilterSchema.optional(),
  })
  .strict();

/** 原始查询参数（解析 limit 前）。 */
export type TranscriptionTaskListQueryRaw = z.infer<
  typeof transcriptionTaskListQuerySchema
>;

/** 转写任务列表查询 DTO（含已解析的 `limit`）。 */
export interface TranscriptionTaskListQuery {
  readonly limit: number;
  readonly cursor?: string;
  readonly status?: TranscriptionTaskStatus;
}

/**
 * 解析并校验转写任务列表查询参数；失败抛出 `ZodError`。
 */
export function parseTranscriptionTaskListQuery(
  input: unknown,
): TranscriptionTaskListQuery {
  const raw = transcriptionTaskListQuerySchema.parse(input);
  const limit = parseLimit({ requested: raw.limit, maxLimit: MAX_PAGE_LIMIT });
  return {
    limit,
    cursor: raw.cursor,
    status: raw.status,
  };
}
