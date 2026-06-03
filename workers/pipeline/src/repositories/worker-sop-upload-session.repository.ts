import type { PoolClient } from "pg";

/**
 * Worker 侧 SOP 卷宗上传会话只读查询（`upload_sessions.pipeline_id` 非空）。
 */
export class WorkerSopUploadSessionRepository {
  /** 按会话 ID 读取 Storage 前缀。 */
  async findStorageKeyPrefix(
    client: PoolClient,
    uploadSessionId: string,
  ): Promise<string | null> {
    const result = await client.query<{ storage_key_prefix: string }>(
      `SELECT storage_key_prefix
       FROM public.upload_sessions
       WHERE id = $1::uuid
         AND pipeline_id IS NOT NULL`,
      [uploadSessionId],
    );
    return result.rows[0]?.storage_key_prefix ?? null;
  }
}
