import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  type StorageRuntimeEnvConfig,
  type SupabaseEnvConfig,
} from "@lexos/shared/config";
import type {
  CreateResumableUploadParams,
  ResumableUploadMetadata,
  StorageAdapter,
  StorageObjectHead,
  StorageObjectSummary,
} from "./storage.adapter.js";

const TUS_SIGNATURE_HEADER = "x-signature";

/**
 * 构建 Supabase Storage TUS 签名上传端点（`architecture.md` §5.5.1）。
 */
export function buildTusResumableSignEndpoint(supabaseUrl: string): string {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/upload/resumable/sign`;
}

/**
 * Supabase Storage 实现（`service_role`；禁止将令牌写入日志）。
 */
export class SupabaseStorageAdapter implements StorageAdapter {
  private readonly adminClient: SupabaseClient;
  private readonly mediaBucket: string;
  private readonly operationTimeoutMs: number;
  private readonly tusEndpoint: string;

  /**
   * @param supabaseEnv - `SUPABASE_URL` 与 `SUPABASE_SERVICE_ROLE_KEY`
   * @param storageEnv - `STORAGE_BUCKET_MEDIA` 等
   */
  constructor(
    supabaseEnv: SupabaseEnvConfig,
    private readonly storageEnv: StorageRuntimeEnvConfig,
  ) {
    this.mediaBucket = storageEnv.storageBucketMedia;
    this.operationTimeoutMs = storageEnv.storageOperationTimeoutMs;
    this.tusEndpoint = buildTusResumableSignEndpoint(supabaseEnv.supabaseUrl);
    this.adminClient = createClient(
      supabaseEnv.supabaseUrl,
      supabaseEnv.supabaseServiceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }

  /** @inheritdoc */
  async listObjectsByPrefix(prefix: string): Promise<StorageObjectSummary[]> {
    const normalizedPrefix = normalizePrefix(prefix);
    const { data, error } = await this.adminClient.storage
      .from(this.mediaBucket)
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
        const metadata = entry.metadata as { size?: number; mimetype?: string } | null;
        return {
          name,
          sizeBytes:
            typeof metadata?.size === "number" ? metadata.size : null,
          mimeType:
            typeof metadata?.mimetype === "string" ? metadata.mimetype : null,
        };
      });
  }

  /** @inheritdoc */
  async headObject(objectKey: string): Promise<StorageObjectHead | null> {
    const { data, error } = await this.adminClient.storage
      .from(this.mediaBucket)
      .info(objectKey);

    if (error) {
      if (isNotFoundStorageError(error.message)) {
        return null;
      }
      throw new Error(`Storage info failed: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const metadata = data.metadata as { size?: number; mimetype?: string } | null;
    return {
      name: objectKey,
      sizeBytes: typeof metadata?.size === "number" ? metadata.size : null,
      mimeType:
        typeof metadata?.mimetype === "string" ? metadata.mimetype : null,
      lastModified:
        typeof data.lastModified === "string" ? data.lastModified : null,
    };
  }

  /** @inheritdoc */
  async createResumableUploadUrl(
    params: CreateResumableUploadParams,
  ): Promise<ResumableUploadMetadata> {
    const { data, error } = await this.adminClient.storage
      .from(this.mediaBucket)
      .createSignedUploadUrl(params.objectKey, {
        upsert: params.upsert ?? false,
      });

    if (error || !data?.token) {
      throw new Error(
        `Storage signed upload URL failed: ${error?.message ?? "missing token"}`,
      );
    }

    return {
      tusEndpoint: this.tusEndpoint,
      tusHeaders: {
        [TUS_SIGNATURE_HEADER]: data.token,
      },
      objectKey: data.path ?? params.objectKey,
    };
  }

  /**
   * 暴露操作超时供外层 `AbortSignal` 组合（不在此适配器内硬编码阈值）。
   */
  getOperationTimeoutMs(): number {
    return this.operationTimeoutMs;
  }

  /** 媒体桶名称（来自环境配置）。 */
  getMediaBucketName(): string {
    return this.mediaBucket;
  }
}

function normalizePrefix(prefix: string): string {
  const trimmed = prefix.trim().replace(/^\/+/, "");
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

function joinStorageKey(prefix: string, name: string): string {
  return `${normalizePrefix(prefix)}${name.replace(/^\/+/, "")}`;
}

function isNotFoundStorageError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("not found") || lower.includes("object not found");
}
