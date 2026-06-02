import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PoolClient } from "pg";
import type { SupabaseEnvConfig } from "@lexos/shared/config";

/** SOP 卷宗 `upload_sessions` 行（`pipeline_id` 非空、`task_id` 空）。 */
export interface SopUploadSessionRecord {
  readonly id: string;
  readonly pipelineId: string;
  readonly ownerId: string;
  readonly storageKeyPrefix: string;
  readonly expectedMaxBytes: number;
  readonly expiresAt: string;
  readonly completedAt: string | null;
  readonly createdAt: string;
}

interface SopUploadSessionRowDb {
  readonly id: string;
  readonly pipeline_id: string;
  readonly owner_id: string;
  readonly storage_key_prefix: string;
  readonly expected_max_bytes: number;
  readonly expires_at: string;
  readonly completed_at: string | null;
  readonly created_at: string;
}

const SOP_UPLOAD_SESSION_SELECT =
  "id, pipeline_id, owner_id, storage_key_prefix, expected_max_bytes, expires_at, completed_at, created_at";

/** 上传会话默认有效期（与 `database.md` §3.13 默认 24h 一致）。 */
const DEFAULT_UPLOAD_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/** `create` 入参。 */
export interface CreateSopUploadSessionInput {
  readonly pipelineId: string;
  readonly ownerId: string;
  readonly storageKeyPrefix: string;
  readonly expectedMaxBytes: number;
  readonly expiresAt?: Date;
}

/**
 * SOP 卷宗 TUS 上传会话仓储（`database.md` §3.13 · M10 `upload_sessions_sop`）。
 */
export class SopUploadSessionRepository {
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  constructor(supabaseEnv: SupabaseEnvConfig) {
    this.supabaseUrl = supabaseEnv.supabaseUrl;
    this.supabaseAnonKey = supabaseEnv.supabaseAnonKey;
  }

  /**
   * 创建 SOP 上传会话（`task_id` 为 NULL，`pipeline_id` 非空）。
   */
  async create(
    accessToken: string,
    input: CreateSopUploadSessionInput,
  ): Promise<SopUploadSessionRecord> {
    const expiresAt =
      input.expiresAt ?? new Date(Date.now() + DEFAULT_UPLOAD_SESSION_TTL_MS);
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("upload_sessions")
      .insert({
        task_id: null,
        pipeline_id: input.pipelineId,
        owner_id: input.ownerId,
        storage_key_prefix: input.storageKeyPrefix,
        expected_max_bytes: input.expectedMaxBytes,
        expires_at: expiresAt.toISOString(),
      })
      .select(SOP_UPLOAD_SESSION_SELECT)
      .single();

    if (error) {
      throw new Error(`upload_sessions.createSop failed: ${error.message}`);
    }
    return mapSopUploadSessionRow(data as SopUploadSessionRowDb);
  }

  /**
   * 按 ID 查询且校验归属。
   */
  async findByIdForOwner(
    accessToken: string,
    uploadSessionId: string,
    ownerId: string,
  ): Promise<SopUploadSessionRecord | null> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("upload_sessions")
      .select(SOP_UPLOAD_SESSION_SELECT)
      .eq("id", uploadSessionId)
      .eq("owner_id", ownerId)
      .not("pipeline_id", "is", null)
      .maybeSingle();

    if (error) {
      throw new Error(
        `upload_sessions.findByIdForOwnerSop failed: ${error.message}`,
      );
    }
    return data ? mapSopUploadSessionRow(data as SopUploadSessionRowDb) : null;
  }

  /**
   * 查询流水线下未完成的 SOP 会话（幂等 `init` 回放用）。
   */
  async findOpenByPipelineId(
    accessToken: string,
    pipelineId: string,
  ): Promise<SopUploadSessionRecord | null> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("upload_sessions")
      .select(SOP_UPLOAD_SESSION_SELECT)
      .eq("pipeline_id", pipelineId)
      .is("task_id", null)
      .is("completed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(
        `upload_sessions.findOpenByPipelineId failed: ${error.message}`,
      );
    }
    return data ? mapSopUploadSessionRow(data as SopUploadSessionRowDb) : null;
  }

  /**
   * 在事务内标记会话完成。
   */
  async markCompleted(
    client: PoolClient,
    uploadSessionId: string,
  ): Promise<void> {
    const result = await client.query(
      `UPDATE public.upload_sessions
       SET completed_at = now()
       WHERE id = $1::uuid
         AND pipeline_id IS NOT NULL
         AND task_id IS NULL
         AND completed_at IS NULL`,
      [uploadSessionId],
    );
    if (result.rowCount !== 1) {
      throw new Error("upload_sessions.markCompletedSop affected unexpected rows");
    }
  }

  private userClient(accessToken: string): SupabaseClient {
    return createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }
}

function mapSopUploadSessionRow(row: SopUploadSessionRowDb): SopUploadSessionRecord {
  return {
    id: row.id,
    pipelineId: row.pipeline_id,
    ownerId: row.owner_id,
    storageKeyPrefix: row.storage_key_prefix,
    expectedMaxBytes: Number(row.expected_max_bytes),
    expiresAt: row.expires_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}
