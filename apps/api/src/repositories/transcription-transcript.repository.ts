import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseEnvConfig } from "@lexos/shared/config";

/** Supabase `transcription_transcripts` 行（查询子集）。 */
export interface TranscriptionTranscriptRowDb {
  readonly task_id: string;
  readonly asr_raw_json: unknown | null;
  readonly polished_text: string | null;
  readonly summary_text: string | null;
  readonly version: number;
  readonly updated_at: string;
}

/** 领域层文稿记录。 */
export interface TranscriptionTranscriptRecord {
  readonly taskId: string;
  readonly asrRawJson: unknown | null;
  readonly polishedText: string | null;
  readonly summaryText: string | null;
  readonly version: number;
  readonly updatedAt: string;
}

/** 乐观锁更新结果。 */
export interface UpdatePolishedTextResult {
  readonly updated: boolean;
  readonly record: TranscriptionTranscriptRecord | null;
}

const TRANSCRIPTION_TRANSCRIPT_SELECT =
  "task_id, asr_raw_json, polished_text, summary_text, version, updated_at";

/**
 * 转写文稿仓储（用户 JWT + RLS；`database.md` §3.4 · §4.4.3）。
 */
export class TranscriptionTranscriptRepository {
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  constructor(supabaseEnv: SupabaseEnvConfig) {
    this.supabaseUrl = supabaseEnv.supabaseUrl;
    this.supabaseAnonKey = supabaseEnv.supabaseAnonKey;
  }

  /**
   * 按任务 ID 查询文稿（RLS 限制可见范围）。
   */
  async findByTaskId(
    accessToken: string,
    taskId: string,
  ): Promise<TranscriptionTranscriptRecord | null> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("transcription_transcripts")
      .select(TRANSCRIPTION_TRANSCRIPT_SELECT)
      .eq("task_id", taskId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `transcription_transcripts.findByTaskId failed: ${error.message}`,
      );
    }
    return data
      ? mapTranscriptionTranscriptRow(data as TranscriptionTranscriptRowDb)
      : null;
  }

  /**
   * 乐观锁更新润色文稿（`WHERE version = expectedVersion`）。
   *
   * @returns `updated: false` 当版本冲突或行不存在
   */
  async updatePolishedText(
    accessToken: string,
    taskId: string,
    polishedText: string,
    expectedVersion: number,
    updatedBy: string,
  ): Promise<UpdatePolishedTextResult> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("transcription_transcripts")
      .update({
        polished_text: polishedText,
        version: expectedVersion + 1,
        updated_by: updatedBy,
      })
      .eq("task_id", taskId)
      .eq("version", expectedVersion)
      .select(TRANSCRIPTION_TRANSCRIPT_SELECT)
      .maybeSingle();

    if (error) {
      throw new Error(
        `transcription_transcripts.updatePolishedText failed: ${error.message}`,
      );
    }

    if (!data) {
      return { updated: false, record: null };
    }

    return {
      updated: true,
      record: mapTranscriptionTranscriptRow(data as TranscriptionTranscriptRowDb),
    };
  }

  private userClient(accessToken: string): SupabaseClient {
    return createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }
}

function mapTranscriptionTranscriptRow(
  row: TranscriptionTranscriptRowDb,
): TranscriptionTranscriptRecord {
  return {
    taskId: row.task_id,
    asrRawJson: row.asr_raw_json,
    polishedText: row.polished_text,
    summaryText: row.summary_text,
    version: row.version,
    updatedAt: row.updated_at,
  };
}
