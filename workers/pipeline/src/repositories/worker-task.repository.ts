import type { PoolClient } from "pg";
import type { TranscriptionTaskStatus } from "@lexos/shared";

/** 转写任务行（Worker 读取子集）。 */
export interface WorkerTaskRow {
  readonly id: string;
  readonly createdBy: string;
  readonly title: string;
  readonly status: TranscriptionTaskStatus;
  readonly sourceStorageKey: string;
  readonly audioStorageKey: string | null;
  readonly isMp4: boolean;
  readonly durationSec: number | null;
  readonly sizeBytes: string;
}

interface WorkerTaskRowDb {
  readonly id: string;
  readonly created_by: string;
  readonly title: string;
  readonly status: TranscriptionTaskStatus;
  readonly source_storage_key: string;
  readonly audio_storage_key: string | null;
  readonly is_mp4: boolean;
  readonly duration_sec: number | null;
  readonly size_bytes: string;
}

/**
 * Worker 侧转写任务读写（`service_role` 连接上下文）。
 */
export class WorkerTaskRepository {
  /** 按 id 读取任务。 */
  async findById(
    client: PoolClient,
    taskId: string,
  ): Promise<WorkerTaskRow | null> {
    const result = await client.query<WorkerTaskRowDb>(
      `SELECT id, created_by, title, status, source_storage_key, audio_storage_key,
              is_mp4, duration_sec, size_bytes::text
       FROM public.transcription_tasks
       WHERE id = $1::uuid
         AND deleted_at IS NULL`,
      [taskId],
    );
    const row = result.rows[0];
    return row ? mapTaskRow(row) : null;
  }

  /** 封装 `transition_task_status`。 */
  async transitionTaskStatus(
    client: PoolClient,
    taskId: string,
    from: TranscriptionTaskStatus,
    to: TranscriptionTaskStatus,
  ): Promise<boolean> {
    const result = await client.query<{ ok: boolean }>(
      `SELECT public.transition_task_status(
         $1::uuid,
         $2::public.transcription_task_status,
         $3::public.transcription_task_status
       ) AS ok`,
      [taskId, from, to],
    );
    return result.rows[0]?.ok === true;
  }

  /** 更新音频 Storage 键（MP4 抽音后）。 */
  async updateAudioStorageKey(
    client: PoolClient,
    taskId: string,
    audioStorageKey: string,
  ): Promise<void> {
    const result = await client.query(
      `UPDATE public.transcription_tasks
       SET audio_storage_key = $2,
           last_progress_at = now(),
           updated_at = now()
       WHERE id = $1::uuid
         AND deleted_at IS NULL`,
      [taskId, audioStorageKey],
    );
    if (result.rowCount !== 1) {
      throw new Error("transcription_tasks.updateAudioStorageKey failed");
    }
  }

  /** 标记任务失败并迁移至 `failed`。 */
  async failTask(
    client: PoolClient,
    taskId: string,
    fromStatus: TranscriptionTaskStatus,
    errorCode: string,
    errorMessage: string,
  ): Promise<void> {
    await client.query(
      `UPDATE public.transcription_tasks
       SET error_code = $2,
           error_message = $3,
           updated_at = now()
       WHERE id = $1::uuid`,
      [taskId, errorCode, errorMessage],
    );
    const transitioned = await this.transitionTaskStatus(
      client,
      taskId,
      fromStatus,
      "failed",
    );
    if (!transitioned) {
      throw new Error(
        `transition_task_status failed: ${fromStatus} -> failed for ${taskId}`,
      );
    }
  }

  /** 更新 Diarization 降级标记。 */
  async updateDiarizationDegraded(
    client: PoolClient,
    taskId: string,
    degraded: boolean,
  ): Promise<void> {
    await client.query(
      `UPDATE public.transcription_tasks
       SET diarization_degraded = $2,
           last_progress_at = now(),
           updated_at = now()
       WHERE id = $1::uuid`,
      [taskId, degraded],
    );
  }

  /** 回写归档目录 id。 */
  async setArchiveFolderId(
    client: PoolClient,
    taskId: string,
    folderId: string,
  ): Promise<void> {
    await client.query(
      `UPDATE public.transcription_tasks
       SET archive_folder_id = $2::uuid,
           last_progress_at = now(),
           updated_at = now()
       WHERE id = $1::uuid`,
      [taskId, folderId],
    );
  }

  /** 标记任务失败。 */
  async markFailed(
    client: PoolClient,
    taskId: string,
    errorCode: string,
    errorMessage: string,
  ): Promise<void> {
    await client.query(
      `UPDATE public.transcription_tasks
       SET error_code = $2,
           error_message = $3,
           updated_at = now()
       WHERE id = $1::uuid`,
      [taskId, errorCode, errorMessage],
    );
  }
}

function mapTaskRow(row: WorkerTaskRowDb): WorkerTaskRow {
  return {
    id: row.id,
    createdBy: row.created_by,
    title: row.title,
    status: row.status,
    sourceStorageKey: row.source_storage_key,
    audioStorageKey: row.audio_storage_key,
    isMp4: row.is_mp4,
    durationSec: row.duration_sec,
    sizeBytes: row.size_bytes,
  };
}
