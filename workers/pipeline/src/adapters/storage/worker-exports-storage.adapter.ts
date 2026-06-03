import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  StorageRuntimeEnvConfig,
  SupabaseEnvConfig,
} from "@lexos/shared/config";

/**
 * Worker 专用 `exports` 桶上传（SOP PDF · `database.md` §3.16.8）。
 */
export class WorkerExportsStorageAdapter {
  private readonly client: SupabaseClient;
  private readonly bucket: string;

  constructor(
    supabaseEnv: Pick<
      SupabaseEnvConfig,
      "supabaseUrl" | "supabaseServiceRoleKey"
    >,
    storageEnv: Pick<StorageRuntimeEnvConfig, "storageBucketExports">,
    clientFactory: (
      url: string,
      key: string,
    ) => SupabaseClient = (url, key) =>
      createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
  ) {
    this.bucket = storageEnv.storageBucketExports;
    this.client = clientFactory(
      supabaseEnv.supabaseUrl,
      supabaseEnv.supabaseServiceRoleKey,
    );
  }

  /** 上传 PDF 二进制至 `exports` 桶。 */
  async uploadPdfBuffer(storageKey: string, buffer: Buffer): Promise<void> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(storageKey, buffer, {
        upsert: true,
        contentType: "application/pdf",
      });
    if (error) {
      throw new Error(
        `Storage PDF upload failed for ${storageKey}: ${error.message}`,
      );
    }
  }
}
