import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseEnvConfig } from "@lexos/shared/config";
import {
  decodeTaskListCursor,
  encodeTaskListCursor,
  mapTranscriptionTaskDetail,
  mapTranscriptionTaskRow,
  mapTranscriptionTaskSummary,
  mapTranscriptSummaryEmbedded,
  TRANSCRIPTION_TASK_DETAIL_SELECT,
  TRANSCRIPTION_TASK_LIST_SELECT,
  TRANSCRIPTION_TASK_SELECT,
  type CreateUploadingTaskInput,
  type TranscriptionTaskDetail,
  type TranscriptionTaskListParams,
  type TranscriptionTaskListResult,
  type TranscriptionTaskRecord,
  type TranscriptionTaskRowDb,
} from "./transcription-task.types.js";

/**
 * 转写任务仓储（用户 JWT + RLS；`database.md` §3.2 · §4.3）。
 */
export class TranscriptionTaskRepository {
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  constructor(supabaseEnv: SupabaseEnvConfig) {
    this.supabaseUrl = supabaseEnv.supabaseUrl;
    this.supabaseAnonKey = supabaseEnv.supabaseAnonKey;
  }

  /**
   * 创建 `uploading` 状态任务（律师/管理员 JWT；`created_by = auth.uid()`）。
   */
  async createUploading(
    accessToken: string,
    input: CreateUploadingTaskInput,
  ): Promise<TranscriptionTaskRecord> {
    const client = this.userClient(accessToken);
    const payload: Record<string, unknown> = {
      created_by: input.createdBy,
      title: input.title,
      status: "uploading",
      source_mime: input.sourceMime,
      source_storage_key: input.sourceStorageKey,
      size_bytes: input.sizeBytes,
      is_mp4: input.isMp4,
    };
    if (input.durationSec != null) {
      payload.duration_sec = input.durationSec;
    }
    if (input.idempotencyKey) {
      payload.idempotency_key = input.idempotencyKey;
    }
    if (input.maxSpeakers != null) {
      payload.max_speakers = input.maxSpeakers;
    }

    const { data, error } = await client
      .from("transcription_tasks")
      .insert(payload)
      .select(TRANSCRIPTION_TASK_SELECT)
      .single();

    if (error) {
      throw new Error(`transcription_tasks.createUploading failed: ${error.message}`);
    }
    return mapTranscriptionTaskRow(data as TranscriptionTaskRowDb);
  }

  /**
   * 按幂等键查询未删除任务（RLS 限制可见范围）。
   */
  async findByIdempotencyKey(
    accessToken: string,
    idempotencyKey: string,
  ): Promise<TranscriptionTaskRecord | null> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("transcription_tasks")
      .select(TRANSCRIPTION_TASK_SELECT)
      .eq("idempotency_key", idempotencyKey)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(
        `transcription_tasks.findByIdempotencyKey failed: ${error.message}`,
      );
    }
    return data ? mapTranscriptionTaskRow(data as TranscriptionTaskRowDb) : null;
  }

  /**
   * 上传阶段更新计划中的 `source_storage_key`（仍为 `uploading`）。
   */
  async updateSourceStorageKey(
    accessToken: string,
    taskId: string,
    sourceStorageKey: string,
  ): Promise<TranscriptionTaskRecord> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("transcription_tasks")
      .update({ source_storage_key: sourceStorageKey })
      .eq("id", taskId)
      .eq("status", "uploading")
      .select(TRANSCRIPTION_TASK_SELECT)
      .single();

    if (error) {
      throw new Error(
        `transcription_tasks.updateSourceStorageKey failed: ${error.message}`,
      );
    }
    return mapTranscriptionTaskRow(data as TranscriptionTaskRowDb);
  }

  /**
   * 按 ID 查询（律师仅本人；admin 可见全部，RLS 生效）。
   */
  async findById(
    accessToken: string,
    taskId: string,
  ): Promise<TranscriptionTaskRecord | null> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("transcription_tasks")
      .select(TRANSCRIPTION_TASK_SELECT)
      .eq("id", taskId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(`transcription_tasks.findById failed: ${error.message}`);
    }
    return data ? mapTranscriptionTaskRow(data as TranscriptionTaskRowDb) : null;
  }

  /**
   * 查询任务详情（含 `diarization_degraded` 与内嵌文稿摘要）。
   */
  async findDetailForUser(
    accessToken: string,
    taskId: string,
  ): Promise<TranscriptionTaskDetail | null> {
    const client = this.userClient(accessToken);
    const { data: taskData, error: taskError } = await client
      .from("transcription_tasks")
      .select(TRANSCRIPTION_TASK_DETAIL_SELECT)
      .eq("id", taskId)
      .is("deleted_at", null)
      .maybeSingle();

    if (taskError) {
      throw new Error(
        `transcription_tasks.findDetailForUser failed: ${taskError.message}`,
      );
    }
    if (!taskData) {
      return null;
    }

    const { data: transcriptData, error: transcriptError } = await client
      .from("transcription_transcripts")
      .select("version, summary_text, updated_at")
      .eq("task_id", taskId)
      .maybeSingle();

    if (transcriptError) {
      throw new Error(
        `transcription_transcripts.findDetailForUser failed: ${transcriptError.message}`,
      );
    }

    const transcript = transcriptData
      ? mapTranscriptSummaryEmbedded(
          transcriptData as {
            version: number;
            summary_text: string | null;
            updated_at: string;
          },
        )
      : null;

    return mapTranscriptionTaskDetail(
      taskData as Pick<
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
        | "max_speakers"
        | "llm_polish_failed"
        | "llm_summary_failed"
        | "error_code"
        | "error_message"
      >,
      transcript,
    );
  }

  /**
   * 软删除任务（设置 `deleted_at`；RLS 限制本人或 admin）。
   */
  async softDelete(
    accessToken: string,
    taskId: string,
  ): Promise<TranscriptionTaskRecord | null> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("transcription_tasks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", taskId)
      .is("deleted_at", null)
      .select(TRANSCRIPTION_TASK_SELECT)
      .maybeSingle();

    if (error) {
      throw new Error(`transcription_tasks.softDelete failed: ${error.message}`);
    }
    return data ? mapTranscriptionTaskRow(data as TranscriptionTaskRowDb) : null;
  }

  /**
   * 律师 JWT 分页列表（RLS：`created_by = auth.uid()`）。
   */
  async listForUser(
    accessToken: string,
    params: TranscriptionTaskListParams,
  ): Promise<TranscriptionTaskListResult> {
    return this.list(accessToken, params);
  }

  /**
   * 管理员 JWT 分页列表（RLS：`is_admin()` 可见全部）。
   */
  async listAll(
    accessToken: string,
    params: TranscriptionTaskListParams,
  ): Promise<TranscriptionTaskListResult> {
    return this.list(accessToken, params);
  }

  private async list(
    accessToken: string,
    params: TranscriptionTaskListParams,
  ): Promise<TranscriptionTaskListResult> {
    const client = this.userClient(accessToken);
    let query = client
      .from("transcription_tasks")
      .select(TRANSCRIPTION_TASK_LIST_SELECT)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(params.limit + 1);

    if (params.status) {
      query = query.eq("status", params.status);
    }

    if (params.cursor) {
      const { createdAt, id } = decodeTaskListCursor(params.cursor);
      query = query.or(
        `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`,
      );
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`transcription_tasks.list failed: ${error.message}`);
    }

    const rows = (data ?? []) as Pick<
      TranscriptionTaskRowDb,
      "id" | "title" | "status" | "duration_sec" | "size_bytes" | "created_at"
    >[];

    const hasMore = rows.length > params.limit;
    const pageRows = hasMore ? rows.slice(0, params.limit) : rows;
    const items = pageRows.map(mapTranscriptionTaskSummary);
    const last = pageRows.at(-1);

    return {
      items,
      nextCursor:
        hasMore && last
          ? encodeTaskListCursor(last.created_at, last.id)
          : undefined,
    };
  }

  private userClient(accessToken: string): SupabaseClient {
    return createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }
}
