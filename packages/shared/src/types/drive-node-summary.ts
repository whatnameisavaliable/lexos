import type { DriveNodeType } from "../enums/drive-node-type.js";

/**
 * 云盘节点列表/详情摘要（`GET /api/drive/nodes` · `tasks.md` M7-A）。
 */
export interface DriveNodeSummary {
  readonly id: string;
  readonly nodeType: DriveNodeType;
  readonly name: string;
  /** 文件大小（字节）；文件夹为 `null`。 */
  readonly sizeBytes: number | null;
  /** 文件 MIME；文件夹为 `null`。 */
  readonly mimeType: string | null;
  /** 关联转写任务 id（归档目录）；无关联为 `null`。 */
  readonly linkedTaskId: string | null;
  /** 是否为转写自动归档目录（供 UI 只读标识）。 */
  readonly isArchiveFolder?: boolean;
  readonly updatedAt: string;
}
