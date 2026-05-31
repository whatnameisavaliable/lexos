import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseEnvConfig } from "@lexos/shared/config";
import type { StorageRuntimeEnvConfig } from "@lexos/shared/config";

/** 单个 Storage 桶 HEAD 探测结果。 */
export interface StorageBucketHealthResult {
  readonly ok: boolean;
  readonly bucket: string;
  readonly latencyMs?: number;
  readonly errorMessage?: string;
}

/** Storage 双桶（media / exports）聚合探测结果。 */
export interface StorageHealthResult {
  readonly media: StorageBucketHealthResult;
  readonly exports: StorageBucketHealthResult;
}

/**
 * 使用 Supabase Storage API 探测桶可达性（`architecture.md` §4.4.1 HEAD）。
 */
export class StorageHealthRepository {
  private readonly adminClient: SupabaseClient;

  /**
   * @param supabaseEnv - `SUPABASE_URL` 与 `SUPABASE_SERVICE_ROLE_KEY`
   * @param storageEnv - `STORAGE_BUCKET_MEDIA` / `STORAGE_BUCKET_EXPORTS`
   */
  constructor(
    supabaseEnv: SupabaseEnvConfig,
    private readonly storageEnv: StorageRuntimeEnvConfig,
  ) {
    this.adminClient = createClient(
      supabaseEnv.supabaseUrl,
      supabaseEnv.supabaseServiceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }

  /**
   * 探测 media 与 exports 桶是否可访问。
   */
  async pingBuckets(): Promise<StorageHealthResult> {
    const [media, exportsBucket] = await Promise.all([
      this.headBucket(this.storageEnv.storageBucketMedia),
      this.headBucket(this.storageEnv.storageBucketExports),
    ]);
    return { media, exports: exportsBucket };
  }

  /**
   * 对指定桶执行等价 HEAD（`getBucket`）。
   *
   * @param bucketName - 桶名称（来自环境配置）
   */
  private async headBucket(
    bucketName: string,
  ): Promise<StorageBucketHealthResult> {
    const started = Date.now();
    const { data, error } = await this.adminClient.storage.getBucket(
      bucketName,
    );

    if (error || !data) {
      return {
        ok: false,
        bucket: bucketName,
        latencyMs: Date.now() - started,
        errorMessage: error?.message ?? "bucket not found",
      };
    }

    return {
      ok: true,
      bucket: bucketName,
      latencyMs: Date.now() - started,
    };
  }
}
