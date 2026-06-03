import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  StorageRuntimeEnvConfig,
  SupabaseEnvConfig,
} from "@lexos/shared/config";

/** Storage 对象列表项（`listObjectsByPrefix` 返回）。 */
export interface StorageObjectSummary {
  readonly name: string;
  readonly sizeBytes: number | null;
  readonly mimeType: string | null;
}

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

  /** 生成临时可读 URL（供 DashScope 等需公网 file_url 的 ASR 使用）。 */
  async createSignedDownloadUrl(
    storageKey: string,
    expiresInSec: number,
  ): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(storageKey, expiresInSec);
    if (error || !data?.signedUrl) {
      throw new Error(
        `Storage signed URL failed for ${storageKey}: ${error?.message ?? "empty"}`,
      );
    }
    return data.signedUrl;
  }

  /** 删除临时对象（失败时忽略）。 */
  async removeObject(storageKey: string): Promise<void> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .remove([storageKey]);
    if (error) {
      throw new Error(
        `Storage remove failed for ${storageKey}: ${error.message}`,
      );
    }
  }

  /** 列举前缀下文件对象（跳过文件夹占位项）。 */
  async listObjectsByPrefix(prefix: string): Promise<StorageObjectSummary[]> {
    const normalizedPrefix = normalizePrefix(prefix);
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .list(normalizedPrefix, {
        limit: 1000,
        sortBy: { column: "name", order: "asc" },
      });

    if (error) {
      throw new Error(`Storage list failed: ${error.message}`);
    }

    return (data ?? [])
      .filter((entry) => entry.id != null)
      .map((entry) => {
        const name = joinStorageKey(normalizedPrefix, entry.name);
        const metadata = entry.metadata as {
          size?: number;
          mimetype?: string;
        } | null;
        return {
          name,
          sizeBytes:
            typeof metadata?.size === "number" ? metadata.size : null,
          mimeType:
            typeof metadata?.mimetype === "string" ? metadata.mimetype : null,
        };
      });
  }
}

function normalizePrefix(prefix: string): string {
  const trimmed = prefix.trim().replace(/^\/+/, "");
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

function joinStorageKey(prefix: string, name: string): string {
  return `${normalizePrefix(prefix)}${name.replace(/^\/+/, "")}`;
}
