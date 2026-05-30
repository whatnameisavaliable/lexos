import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseEnvConfig } from "@lexos/shared/config";

/** Supabase `transcription_segments` 行（客户端可见子集）。 */
export interface TranscriptionSegmentRowDb {
  readonly id: string;
  readonly task_id: string;
  readonly segment_index: number;
  readonly start_ms: number;
  readonly end_ms: number;
  readonly asr_text: string | null;
  readonly speaker_label: string | null;
  readonly status: string;
}

/** 领域层转写片段（校对模式只读展示）。 */
export interface TranscriptionSegmentRecord {
  readonly id: string;
  readonly taskId: string;
  readonly segmentIndex: number;
  readonly startMs: number;
  readonly endMs: number;
  readonly asrText: string | null;
  readonly speakerLabel: string | null;
  readonly status: string;
}

const TRANSCRIPTION_SEGMENT_SELECT =
  "id, task_id, segment_index, start_ms, end_ms, asr_text, speaker_label, status";

/**
 * 转写片段仓储（用户 JWT + RLS；`database.md` §3.3 · §4.4.1）。
 */
export class TranscriptionSegmentRepository {
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  constructor(supabaseEnv: SupabaseEnvConfig) {
    this.supabaseUrl = supabaseEnv.supabaseUrl;
    this.supabaseAnonKey = supabaseEnv.supabaseAnonKey;
  }

  /**
   * 按任务 ID 列出片段（按 `segment_index` 升序）。
   */
  async listByTaskId(
    accessToken: string,
    taskId: string,
  ): Promise<readonly TranscriptionSegmentRecord[]> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("transcription_segments")
      .select(TRANSCRIPTION_SEGMENT_SELECT)
      .eq("task_id", taskId)
      .order("segment_index", { ascending: true });

    if (error) {
      throw new Error(
        `transcription_segments.listByTaskId failed: ${error.message}`,
      );
    }

    return (data ?? []).map((row) =>
      mapTranscriptionSegmentRow(row as TranscriptionSegmentRowDb),
    );
  }

  private userClient(accessToken: string): SupabaseClient {
    return createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }
}

function mapTranscriptionSegmentRow(
  row: TranscriptionSegmentRowDb,
): TranscriptionSegmentRecord {
  return {
    id: row.id,
    taskId: row.task_id,
    segmentIndex: row.segment_index,
    startMs: row.start_ms,
    endMs: row.end_ms,
    asrText: row.asr_text,
    speakerLabel: row.speaker_label,
    status: row.status,
  };
}
