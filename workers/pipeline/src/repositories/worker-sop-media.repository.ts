import type { WorkerStorageAdapter } from "../adapters/storage/worker-storage.adapter.js";

/**
 * Worker 侧 SOP 卷宗媒体 Storage 列举（`media` 桶）。
 */
export class WorkerSopMediaRepository {
  constructor(private readonly storageAdapter: WorkerStorageAdapter) {}

  /** 列出前缀下全部对象键（含完整 Storage path）。 */
  async listMediaObjectKeys(storageKeyPrefix: string): Promise<string[]> {
    const objects =
      await this.storageAdapter.listObjectsByPrefix(storageKeyPrefix);
    return objects.map((object) => object.name);
  }
}
