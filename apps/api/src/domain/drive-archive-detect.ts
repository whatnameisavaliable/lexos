import type { DriveNodeType } from "@lexos/shared";
import { DRIVE_ROOT_FOLDER_NAME } from "../repositories/drive-node.types.js";

/** 归档目录检测输入。 */
export interface DriveArchiveDetectInput {
  readonly nodeType: DriveNodeType;
  readonly name: string;
  readonly linkedTaskId: string | null;
  readonly parentName?: string | null;
}

/**
 * 判断云盘节点是否为转写自动归档目录（供 UI 只读/可重命名标识 · `ui_design.md` §6.4.2）。
 *
 * 规则：文件夹且 `linked_task_id` 非空，或位于 `YYYY-MM-DD` 日期目录下的任务文件夹。
 */
export function isArchiveFolderNode(input: DriveArchiveDetectInput): boolean {
  if (input.nodeType !== "folder") {
    return false;
  }
  if (input.name === DRIVE_ROOT_FOLDER_NAME) {
    return false;
  }
  if (input.linkedTaskId != null) {
    return true;
  }
  if (input.parentName && /^\d{4}-\d{2}-\d{2}$/.test(input.parentName)) {
    return true;
  }
  return false;
}

/**
 * 归档目录是否允许律师重命名（PRD §3.6 允许重命名）。
 */
export function isArchiveFolderRenameAllowed(
  input: DriveArchiveDetectInput,
): boolean {
  return isArchiveFolderNode(input);
}
