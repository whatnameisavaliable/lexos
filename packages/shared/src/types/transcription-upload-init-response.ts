/**
 * `POST /api/transcription/uploads/init` 成功响应 `data` 载荷（`architecture.md` §5.5.1）。
 */
export interface TranscriptionUploadInitResponse {
  /** 上传会话主键，complete 回调时回传。 */
  readonly uploadSessionId: string;
  /** 关联的转写任务 ID。 */
  readonly taskId: string;
  /**
   * Storage 对象键前缀，形如 `{auth.uid()}/{task_id}/`。
   * TUS 上传 **必须** 仅在此前缀下创建对象。
   */
  readonly storageKeyPrefix: string;
  /**
   * 桶内完整对象键（已 ASCII 规范化文件名；TUS `objectName` 须与此一致）。
   */
  readonly storageObjectKey: string;
  /** 媒体桶名（与 `STORAGE_BUCKET_MEDIA` 一致；供 TUS metadata，避免前端硬编码）。 */
  readonly storageBucket: string;
  /** Supabase Storage Resumable Upload（TUS）端点 URL。 */
  readonly tusEndpoint: string;
  /**
   * TUS 请求附加头（如授权）；由 BFF 签发，客户端原样附加。
   * 未配置时省略。
   */
  readonly tusHeaders?: Readonly<Record<string, string>>;
}
