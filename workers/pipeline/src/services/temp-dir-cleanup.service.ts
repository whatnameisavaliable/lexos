import { rm } from "node:fs/promises";
import path from "node:path";

/**
 * 任务临时目录清理（`architecture.md` §3.2.2.5）。
 */
export class TempDirCleanupService {
  constructor(private readonly workerTmpDir: string) {}

  /** 删除 `{taskId}` 临时目录（忽略不存在）。 */
  async cleanupTaskDir(taskId: string): Promise<void> {
    const dir = path.join(this.workerTmpDir, taskId);
    await rm(dir, { recursive: true, force: true });
  }
}
