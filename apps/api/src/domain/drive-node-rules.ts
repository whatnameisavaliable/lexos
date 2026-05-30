import { ErrorCode } from "@lexos/shared/api";
import type { DriveNodeType } from "@lexos/shared";

/** 云盘节点规则校验失败。 */
export class DriveNodeRuleError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "DriveNodeRuleError";
  }
}

/** 节点归属上下文（用于规则校验）。 */
export interface DriveNodeRuleContext {
  readonly nodeType: DriveNodeType;
  readonly parentId: string | null;
  readonly ownerId: string;
}

/**
 * 断言文件节点必须位于目录下（`database.md` §3.5 · PRD §3.6）。
 */
export function assertFileHasParent(parentId: string | null): void {
  if (parentId == null) {
    throw new DriveNodeRuleError(
      ErrorCode.VALIDATION_FAILED,
      "Files must be created inside a folder",
    );
  }
}

/**
 * 断言禁止在根目录创建文件节点。
 */
export function assertNotRootFileCreate(
  nodeType: DriveNodeType,
  parentId: string | null,
): void {
  if (nodeType === "file") {
    assertFileHasParent(parentId);
  }
}

/**
 * 断言父目录与当前操作者一致（应用层双重校验）。
 */
export function assertSameOwnerParent(
  parent: { readonly createdBy: string },
  actorUserId: string,
): void {
  if (parent.createdBy !== actorUserId) {
    throw new DriveNodeRuleError(
      ErrorCode.AUTH_FORBIDDEN,
      "Parent folder not accessible",
    );
  }
}
