import type {
  TranscriptionTaskListQuery,
  TranscriptionTaskStatus,
  TranscriptionTaskSummary,
  TranscriptionUploadCompleteBody,
  TranscriptionUploadInitBody,
  TranscriptionUploadInitResponse,
} from "@lexos/shared";
import type { PaginationMeta } from "@lexos/shared/api";
import { setCachedTranscriptVersion } from "./transcript-if-match";
import { apiFetch, ApiClientError } from "./api-client";

/** 签名下载/导出 URL 响应。 */
export interface SignedDownloadUrlResult {
  readonly signedUrl: string;
  readonly expiresInSec: number;
  readonly objectKey: string;
  readonly bucket: string;
}

/** PATCH 文稿成功响应。 */
export interface TranscriptPatchResult {
  readonly taskId: string;
  readonly polishedText: string;
  readonly version: number;
  readonly updatedAt: string;
}

/** `GET /api/transcription/tasks/:id/transcript` 文稿详情。 */
export interface TranscriptionTranscriptDetail {
  readonly taskId: string;
  readonly asrRawJson: unknown | null;
  readonly polishedText: string | null;
  readonly summaryText: string | null;
  readonly version: number;
  readonly diarizationDegraded: boolean;
  readonly updatedAt: string;
}

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
  readonly diarizationDegraded?: boolean;
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

/** `GET /api/transcription/tasks/:id/transcript` */
export async function getTranscript(
  taskId: string,
): Promise<TranscriptionTranscriptDetail> {
  const res = await apiFetch<TranscriptionTranscriptDetail>(
    `/transcription/tasks/${encodeURIComponent(taskId)}/transcript`,
    { method: "GET" },
  );
  setCachedTranscriptVersion(taskId, res.data.version);
  return res.data;
}

/** `PATCH /api/transcription/tasks/:id/transcript` */
export async function patchTranscript(
  taskId: string,
  polishedText: string,
  expectedVersion: number,
): Promise<TranscriptPatchResult> {
  const res = await apiFetch<TranscriptPatchResult>(
    `/transcription/tasks/${encodeURIComponent(taskId)}/transcript`,
    {
      method: "PATCH",
      headers: {
        "If-Match": String(expectedVersion),
      },
      body: JSON.stringify({ polishedText }),
    },
  );
  setCachedTranscriptVersion(taskId, res.data.version);
  return res.data;
}

export type TranscriptionDownloadType = "audio" | "source";

/** `GET /api/transcription/tasks/:id/download` */
export async function getDownloadUrl(
  taskId: string,
  type: TranscriptionDownloadType = "audio",
): Promise<SignedDownloadUrlResult> {
  const res = await apiFetch<SignedDownloadUrlResult>(
    `/transcription/tasks/${encodeURIComponent(taskId)}/download?type=${type}`,
    { method: "GET" },
  );
  return res.data;
}

/** 播放用签名 URL：优先抽音音频，不可用时回退至原始源文件。 */
export async function getPlaybackDownloadUrl(
  taskId: string,
): Promise<{ readonly signedUrl: string; readonly kind: "audio" | "source" }> {
  try {
    const audio = await getDownloadUrl(taskId, "audio");
    return { signedUrl: audio.signedUrl, kind: "audio" };
  } catch {
    const source = await getDownloadUrl(taskId, "source");
    return { signedUrl: source.signedUrl, kind: "source" };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientExportError(err: unknown): boolean {
  if (err instanceof ApiClientError) {
    if (err.status === 502 || err.status === 503 || err.status === 504) {
      return true;
    }
    const lower = err.message.toLowerCase();
    return (
      lower.includes("failed to fetch") ||
      lower.includes("econnreset") ||
      lower.includes("socket hang up") ||
      lower.includes("无法连接 bff/api") ||
      lower.includes("api 返回了 html")
    );
  }
  return err instanceof TypeError;
}

async function postExport(path: string): Promise<SignedDownloadUrlResult> {
  const maxAttempts = 4;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const res = await apiFetch<SignedDownloadUrlResult>(path, { method: "POST" });
      return res.data;
    } catch (err) {
      lastErr = err;
      if (!isTransientExportError(err) || attempt >= maxAttempts) {
        break;
      }
      await sleep(1500 * attempt);
    }
  }

  throw lastErr;
}

/** `POST /api/transcription/tasks/:id/export/docx` */
export async function exportDocx(taskId: string): Promise<SignedDownloadUrlResult> {
  return postExport(
    `/transcription/tasks/${encodeURIComponent(taskId)}/export/docx`,
  );
}

/** `POST /api/transcription/tasks/:id/export/pdf` */
export async function exportPdf(taskId: string): Promise<SignedDownloadUrlResult> {
  return postExport(
    `/transcription/tasks/${encodeURIComponent(taskId)}/export/pdf`,
  );
}

/** `POST /api/transcription/tasks/:id/export/txt` */
export async function exportTxt(taskId: string): Promise<SignedDownloadUrlResult> {
  return postExport(
    `/transcription/tasks/${encodeURIComponent(taskId)}/export/txt`,
  );
}

/** `DELETE /api/transcription/tasks/:id` */
export async function deleteTask(taskId: string): Promise<TranscriptionTaskDetail> {
  const res = await apiFetch<TranscriptionTaskDetail>(
    `/transcription/tasks/${encodeURIComponent(taskId)}`,
    { method: "DELETE" },
  );
  return res.data;
}
