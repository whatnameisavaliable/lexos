import type { TranscriptionUploadInitResponse } from "@lexos/shared";

/** TUS 客户端 `metadata` 字段（Supabase Resumable Upload）。 */
export interface TusUploadMetadata {
  readonly bucketName: string;
  readonly objectName: string;
  readonly contentType: string;
}

/**
 * 构建 `tus-js-client` 所需 endpoint / headers / metadata。
 * 对象键必须使用 BFF 返回的 `storageObjectKey`（已规范化，禁止本地拼接中文路径）。
 */
export function buildTusUploadOptions(
  init: TranscriptionUploadInitResponse,
  file: Pick<File, "name" | "type">,
): {
  readonly endpoint: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly metadata: TusUploadMetadata;
} {
  return {
    endpoint: init.tusEndpoint,
    headers: init.tusHeaders ?? {},
    metadata: {
      bucketName: init.storageBucket,
      objectName: init.storageObjectKey,
      contentType: file.type || "application/octet-stream",
    },
  };
}
