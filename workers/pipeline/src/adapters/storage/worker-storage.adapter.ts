import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  StorageRuntimeEnvConfig,
  SupabaseEnvConfig,
} from "@lexos/shared/config";

/**
 * Worker 专用 Storage 下载适配器（流式落盘 · `architecture.md` §3.2.2.1）。
 */
export class WorkerStorageAdapter {
  private readonly client: SupabaseClient;
  private readonly bucket: string;

  constructor(
    supabaseEnv: Pick<
      SupabaseEnvConfig,
      "supabaseUrl" | "supabaseServiceRoleKey"
    >,
    storageEnv: Pick<StorageRuntimeEnvConfig, "storageBucketMedia">,
    clientFactory: (
      url: string,
      key: string,
    ) => SupabaseClient = (url, key) =>
      createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
  ) {
    this.bucket = storageEnv.storageBucketMedia;
    this.client = clientFactory(
      supabaseEnv.supabaseUrl,
      supabaseEnv.supabaseServiceRoleKey,
    );
  }

  /**
   * 从 Storage 流式下载对象至本地文件。
   */
  async downloadToFile(storageKey: string, localPath: string): Promise<void> {
    await mkdir(path.dirname(localPath), { recursive: true });
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .download(storageKey);
    if (error || !data) {
      throw new Error(
        `Storage download failed for ${storageKey}: ${error?.message ?? "empty"}`,
      );
    }

    const readable = data.stream();
    const writable = createWriteStream(localPath);
    await pipeline(readable, writable);
  }
}
