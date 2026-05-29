/**
 * Storage 对象列表项（`listObjectsByPrefix` 返回）。
 */
export interface StorageObjectSummary {
  /** 对象在桶内的完整路径键。 */
  readonly name: string;
  /** 对象大小（字节）；未知时为 `null`。 */
  readonly sizeBytes: number | null;
  /** MIME 类型；未知时为 `null`。 */
  readonly mimeType: string | null;
}

/**
 * `headObject` 返回的元数据。
 */
export interface StorageObjectHead {
  readonly name: string;
  readonly sizeBytes: number | null;
  readonly mimeType: string | null;
  readonly lastModified: string | null;
}

/** TUS 可恢复上传签发参数。 */
export interface CreateResumableUploadParams {
  /** 桶内对象路径，如 `{uid}/{task_id}/file.mp3`。 */
  readonly objectKey: string;
  /** 是否允许覆盖（映射至 Storage `x-upsert`）。 */
  readonly upsert?: boolean;
}

/**
 * BFF 返回给前端的 TUS 元数据（`ui_design.md` §6.3.3）。
 */
export interface ResumableUploadMetadata {
  /** Supabase TUS 签名上传端点（`/storage/v1/upload/resumable/sign`）。 */
  readonly tusEndpoint: string;
  /** TUS 客户端需附加的 HTTP 头（含 `x-signature`）。 */
  readonly tusHeaders: Readonly<Record<string, string>>;
  /** 与 `createSignedUploadUrl` 对应的对象路径。 */
  readonly objectKey: string;
}

/**
 * Supabase Storage 抽象（`architecture.md` §5.5 · StorageAdapter）。
 */
export interface StorageAdapter {
  /**
   * 列出指定前缀下的对象（仅文件，不含纯目录占位）。
   * @param prefix - 路径前缀，如 `{uid}/{task_id}/`
   */
  listObjectsByPrefix(prefix: string): Promise<StorageObjectSummary[]>;

  /**
   * 获取对象元数据；不存在时返回 `null`。
   * @param objectKey - 桶内完整对象键
   */
  headObject(objectKey: string): Promise<StorageObjectHead | null>;

  /**
   * 为 TUS 直传签发签名上传令牌（`createSignedUploadUrl` + resumable/sign 端点）。
   */
  createResumableUploadUrl(
    params: CreateResumableUploadParams,
  ): Promise<ResumableUploadMetadata>;
}
