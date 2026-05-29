import type { TranscriptionUploadInitResponse } from "@lexos/shared";
import { getPublicMediaStorageBucket } from "./public-env";

/** TUS 客户端 `metadata` 字段（Supabase Resumable Upload）。 */
export interface TusUploadMetadata {
  readonly bucketName: string;
  readonly objectName: string;
  readonly contentType: string;
}

/**
 * 由 BFF 返回的 `storageKeyPrefix` 与本地文件名拼接对象键。
 * **禁止**自行构造 `{other_user_id}/...` 前缀（`ui_design.md` §6.3.3）。
 */
export function buildTusObjectName(
  storageKeyPrefix: string,
  fileName: string,
): string {
  const prefix = storageKeyPrefix.endsWith("/")
    ? storageKeyPrefix
    : `${storageKeyPrefix}/`;
  const base =
    fileName.replace(/\\/g, "/").split("/").pop()?.trim() ?? "upload";
  return `${prefix}${base}`;
}

/**
 * 构建 `tus-js-client` 所需 endpoint / headers / metadata。
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
      bucketName: getPublicMediaStorageBucket(),
      objectName: buildTusObjectName(init.storageKeyPrefix, file.name),
      contentType: file.type || "application/octet-stream",
    },
  };
}
