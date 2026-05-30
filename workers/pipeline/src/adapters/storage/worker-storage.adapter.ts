import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
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

  /**
   * 上传本地文件至 Storage（抽音结果等）。
   */
  async uploadFile(localPath: string, storageKey: string): Promise<void> {
    const fileStat = await stat(localPath);
    if (!fileStat.isFile()) {
      throw new Error(`Storage upload source is not a file: ${localPath}`);
    }

    const readable = createReadStream(localPath);
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(storageKey, readable, {
        upsert: true,
        contentType: "audio/mpeg",
      });
    if (error) {
      throw new Error(
        `Storage upload failed for ${storageKey}: ${error.message}`,
      );
    }
  }
}
