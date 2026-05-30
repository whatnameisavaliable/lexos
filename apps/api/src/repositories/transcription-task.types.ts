import type { TranscriptionTaskStatus } from "@lexos/shared";
import type {
  TranscriptionTaskDetail,
  TranscriptionTaskSummary,
  TranscriptSummaryEmbedded,
} from "@lexos/shared";

/** Supabase `transcription_tasks` 行（查询子集）。 */
export interface TranscriptionTaskRowDb {
  readonly id: string;
  readonly created_by: string;
  readonly title: string;
  readonly status: TranscriptionTaskStatus;
  readonly source_mime: string;
  readonly source_storage_key: string;
  readonly audio_storage_key: string | null;
  readonly duration_sec: number | null;
  readonly size_bytes: number;
  readonly is_mp4: boolean;
  readonly asr_queue_tier: "express" | "batch" | null;
  readonly idempotency_key: string | null;
  readonly diarization_degraded: boolean;
  readonly deleted_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

/** 领域层转写任务记录。 */
export interface TranscriptionTaskRecord {
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
  readonly diarizationDegraded: boolean;
  readonly deletedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** `createUploading` 入参。 */
export interface CreateUploadingTaskInput {
  /** 须与 JWT `auth.uid()` 一致（RLS `tasks_insert`）。 */
  readonly createdBy: string;
  readonly title: string;
  readonly sourceMime: string;
  /** 计划对象键（`{uid}/{task_id}/{fileName}`），complete 前占位。 */
  readonly sourceStorageKey: string;
  readonly sizeBytes: number;
  readonly durationSec?: number | null;
  readonly isMp4: boolean;
  readonly idempotencyKey?: string | null;
}

/** 列表查询参数。 */
export interface TranscriptionTaskListParams {
  readonly limit: number;
  readonly cursor?: string;
  readonly status?: TranscriptionTaskStatus;
}

/** 分页列表结果。 */
export interface TranscriptionTaskListResult {
  readonly items: readonly TranscriptionTaskSummary[];
  readonly nextCursor?: string;
}

export const TRANSCRIPTION_TASK_SELECT =
  "id, created_by, title, status, source_mime, source_storage_key, audio_storage_key, duration_sec, size_bytes, is_mp4, asr_queue_tier, idempotency_key, diarization_degraded, deleted_at, created_at, updated_at";

export const TRANSCRIPTION_TASK_DETAIL_SELECT =
  "id, created_by, title, status, source_mime, source_storage_key, audio_storage_key, duration_sec, size_bytes, is_mp4, diarization_degraded, created_at";

export const TRANSCRIPTION_TASK_LIST_SELECT =
  "id, title, status, duration_sec, size_bytes, created_at";

/**
 * 映射数据库行为 {@link TranscriptionTaskRecord}。
 */
export function mapTranscriptionTaskRow(
  row: TranscriptionTaskRowDb,
): TranscriptionTaskRecord {
  return {
    id: row.id,
    createdBy: row.created_by,
    title: row.title,
    status: row.status,
    sourceMime: row.source_mime,
    sourceStorageKey: row.source_storage_key,
    audioStorageKey: row.audio_storage_key,
    durationSec: row.duration_sec,
    sizeBytes: Number(row.size_bytes),
    isMp4: row.is_mp4,
    asrQueueTier: row.asr_queue_tier,
    idempotencyKey: row.idempotency_key,
    diarizationDegraded: row.diarization_degraded,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * 映射列表行。
 */
export function mapTranscriptionTaskSummary(
  row: Pick<
    TranscriptionTaskRowDb,
    "id" | "title" | "status" | "duration_sec" | "size_bytes" | "created_at"
  >,
): TranscriptionTaskSummary {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    durationSec: row.duration_sec,
    sizeBytes: Number(row.size_bytes),
    createdAt: row.created_at,
  };
}

/**
 * 编码列表游标（`created_at` + `id`）。
 */
export function encodeTaskListCursor(createdAt: string, id: string): string {
  return `${createdAt}|${id}`;
}

/**
 * 解码列表游标。
 */
export function decodeTaskListCursor(
  cursor: string,
): { createdAt: string; id: string } {
  const separator = cursor.lastIndexOf("|");
  if (separator <= 0) {
    throw new Error("Invalid task list cursor");
  }
  return {
    createdAt: cursor.slice(0, separator),
    id: cursor.slice(separator + 1),
  };
}

/**
 * 映射任务详情（含内嵌文稿摘要）。
 */
export function mapTranscriptionTaskDetail(
  task: Pick<
    TranscriptionTaskRowDb,
    | "id"
    | "title"
    | "status"
    | "duration_sec"
    | "size_bytes"
    | "created_at"
    | "diarization_degraded"
    | "audio_storage_key"
    | "source_storage_key"
    | "is_mp4"
  >,
  transcript: TranscriptSummaryEmbedded | null,
): TranscriptionTaskDetail {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    durationSec: task.duration_sec,
    sizeBytes: Number(task.size_bytes),
    createdAt: task.created_at,
    diarizationDegraded: task.diarization_degraded,
    audioStorageKey: task.audio_storage_key,
    sourceStorageKey: task.source_storage_key,
    isMp4: task.is_mp4,
    transcript,
  };
}

/**
 * 映射内嵌文稿摘要。
 */
export function mapTranscriptSummaryEmbedded(row: {
  version: number;
  summary_text: string | null;
  updated_at: string;
}): TranscriptSummaryEmbedded {
  return {
    version: row.version,
    summaryText: row.summary_text,
    updatedAt: row.updated_at,
  };
}
