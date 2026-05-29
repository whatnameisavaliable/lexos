import type {
  TranscriptionTaskListQuery,
  TranscriptionTaskStatus,
  TranscriptionTaskSummary,
  TranscriptionUploadCompleteBody,
  TranscriptionUploadInitBody,
  TranscriptionUploadInitResponse,
} from "@lexos/shared";
import type { PaginationMeta } from "@lexos/shared/api";
import { apiFetch } from "./api-client";

/** `GET /api/transcription/tasks/:id` 详情。 */
export interface TranscriptionTaskDetail {
  readonly id: string;
  readonly createdBy: string;
  readonly title: string;
  readonly status: TranscriptionTaskStatus;
  readonly sourceMime: string;
  readonly sourceStorageKey: string;
  readonly audioStorageKey: string | null;
  readonly durationSec: number | null;
  readonly sizeBytes: number;
  readonly isMp4: boolean;
  readonly asrQueueTier: "express" | "batch" | null;
  readonly idempotencyKey: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** `GET /api/transcription/tasks` 响应。 */
export interface TranscriptionTaskListData {
  readonly items: readonly TranscriptionTaskSummary[];
  readonly meta: PaginationMeta;
}

/** `POST /api/transcription/uploads/complete` 响应。 */
export interface TranscriptionUploadCompleteResult {
  readonly taskId: string;
  readonly status: "queued";
}

/** 列表查询参数（query string）。 */
export type TranscriptionTaskListParams = Partial<TranscriptionTaskListQuery>;

/**
 * 构建转写任务列表 API 查询字符串。
 */
export function buildTranscriptionTasksQueryString(
  params?: TranscriptionTaskListParams,
): string {
  if (!params) {
    return "";
  }
  const search = new URLSearchParams();
  if (params.limit !== undefined) {
    search.set("limit", String(params.limit));
  }
  if (params.cursor) {
    search.set("cursor", params.cursor);
  }
  if (params.status) {
    search.set("status", params.status);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** `POST /api/transcription/uploads/init` */
export async function initUpload(
  body: TranscriptionUploadInitBody,
): Promise<TranscriptionUploadInitResponse> {
  const res = await apiFetch<TranscriptionUploadInitResponse>(
    "/transcription/uploads/init",
    {
      method: "POST",
      body: JSON.stringify({
        ...body,
        sizeBytes: Number(body.sizeBytes),
      }),
    },
  );
  return res.data;
}

/** `POST /api/transcription/uploads/complete` */
export async function completeUpload(
  body: TranscriptionUploadCompleteBody,
): Promise<TranscriptionUploadCompleteResult> {
  const res = await apiFetch<TranscriptionUploadCompleteResult>(
    "/transcription/uploads/complete",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  return res.data;
}

/** `GET /api/transcription/tasks` */
export async function listTasks(
  params?: TranscriptionTaskListParams,
): Promise<TranscriptionTaskListData> {
  const res = await apiFetch<TranscriptionTaskListData>(
    `/transcription/tasks${buildTranscriptionTasksQueryString(params)}`,
    { method: "GET" },
  );
  return res.data;
}

/** `GET /api/transcription/tasks/:id` */
export async function getTask(taskId: string): Promise<TranscriptionTaskDetail> {
  const res = await apiFetch<TranscriptionTaskDetail>(
    `/transcription/tasks/${encodeURIComponent(taskId)}`,
    { method: "GET" },
  );
  return res.data;
}
