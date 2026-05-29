import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PoolClient } from "pg";
import type { SupabaseEnvConfig } from "@lexos/shared/config";

/** `upload_sessions` 行。 */
export interface UploadSessionRecord {
  readonly id: string;
  readonly taskId: string;
  readonly ownerId: string;
  readonly storageKeyPrefix: string;
  readonly expectedMaxBytes: number;
  readonly expiresAt: string;
  readonly completedAt: string | null;
  readonly createdAt: string;
}

interface UploadSessionRowDb {
  readonly id: string;
  readonly task_id: string;
  readonly owner_id: string;
  readonly storage_key_prefix: string;
  readonly expected_max_bytes: number;
  readonly expires_at: string;
  readonly completed_at: string | null;
  readonly created_at: string;
}

const UPLOAD_SESSION_SELECT =
  "id, task_id, owner_id, storage_key_prefix, expected_max_bytes, expires_at, completed_at, created_at";

/** 上传会话默认有效期（与 `database.md` §3.13 默认 24h 一致）。 */
const DEFAULT_UPLOAD_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/** `create` 入参。 */
export interface CreateUploadSessionInput {
  readonly taskId: string;
  readonly ownerId: string;
  readonly storageKeyPrefix: string;
  readonly expectedMaxBytes: number;
  readonly expiresAt?: Date;
}

/**
 * TUS 上传会话仓储（`database.md` §3.13）。
 */
export class UploadSessionRepository {
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  constructor(supabaseEnv: SupabaseEnvConfig) {
    this.supabaseUrl = supabaseEnv.supabaseUrl;
    this.supabaseAnonKey = supabaseEnv.supabaseAnonKey;
  }

  /**
   * 创建上传会话（用户 JWT；`owner_id` 须等于 `auth.uid()`）。
   */
  async create(
    accessToken: string,
    input: CreateUploadSessionInput,
  ): Promise<UploadSessionRecord> {
    const expiresAt =
      input.expiresAt ?? new Date(Date.now() + DEFAULT_UPLOAD_SESSION_TTL_MS);
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("upload_sessions")
      .insert({
        task_id: input.taskId,
        owner_id: input.ownerId,
        storage_key_prefix: input.storageKeyPrefix,
        expected_max_bytes: input.expectedMaxBytes,
        expires_at: expiresAt.toISOString(),
      })
      .select(UPLOAD_SESSION_SELECT)
      .single();

    if (error) {
      throw new Error(`upload_sessions.create failed: ${error.message}`);
    }
    return mapUploadSessionRow(data as UploadSessionRowDb);
  }

  /**
   * 按 ID 查询且校验归属（RLS + 显式 `owner_id` 比对）。
   */
  async findByIdForOwner(
    accessToken: string,
    uploadSessionId: string,
    ownerId: string,
  ): Promise<UploadSessionRecord | null> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("upload_sessions")
      .select(UPLOAD_SESSION_SELECT)
      .eq("id", uploadSessionId)
      .eq("owner_id", ownerId)
      .maybeSingle();

    if (error) {
      throw new Error(`upload_sessions.findByIdForOwner failed: ${error.message}`);
    }
    return data ? mapUploadSessionRow(data as UploadSessionRowDb) : null;
  }

  /**
   * 在事务内标记会话完成（`uploads/complete` 与 Outbox 同事务）。
   */
  async markCompleted(
    client: PoolClient,
    uploadSessionId: string,
  ): Promise<void> {
    const result = await client.query(
      `UPDATE public.upload_sessions
       SET completed_at = now()
       WHERE id = $1::uuid
         AND completed_at IS NULL`,
      [uploadSessionId],
    );
    if (result.rowCount !== 1) {
      throw new Error("upload_sessions.markCompleted affected unexpected rows");
    }
  }

  private userClient(accessToken: string): SupabaseClient {
    return createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }
}

function mapUploadSessionRow(row: UploadSessionRowDb): UploadSessionRecord {
  return {
    id: row.id,
    taskId: row.task_id,
    ownerId: row.owner_id,
    storageKeyPrefix: row.storage_key_prefix,
    expectedMaxBytes: Number(row.expected_max_bytes),
    expiresAt: row.expires_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}
