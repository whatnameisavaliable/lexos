import type { DriveNodeType } from "@lexos/shared";
import type { DriveNodeSummary } from "@lexos/shared";

/** Supabase `drive_nodes` 行（查询子集）。 */
export interface DriveNodeRowDb {
  readonly id: string;
  readonly created_by: string;
  readonly parent_id: string | null;
  readonly node_type: DriveNodeType;
  readonly name: string;
  readonly storage_key: string | null;
  readonly mime_type: string | null;
  readonly size_bytes: number | null;
  readonly linked_task_id: string | null;
  readonly deleted_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

/** 领域层云盘节点记录。 */
export interface DriveNodeRecord {
  readonly id: string;
  readonly createdBy: string;
  readonly parentId: string | null;
  readonly nodeType: DriveNodeType;
  readonly name: string;
  readonly storageKey: string | null;
  readonly mimeType: string | null;
  readonly sizeBytes: number | null;
  readonly linkedTaskId: string | null;
  readonly deletedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** 创建文件夹入参。 */
export interface CreateDriveFolderInput {
  readonly createdBy: string;
  readonly parentId: string;
  readonly name: string;
}

/** 创建文件节点入参。 */
export interface CreateDriveFileInput {
  readonly createdBy: string;
  readonly parentId: string;
  readonly name: string;
  readonly storageKey: string;
  readonly mimeType: string;
  readonly sizeBytes: number | null;
  readonly linkedTaskId?: string | null;
}

/** 更新节点入参。 */
export interface UpdateDriveNodeInput {
  readonly name?: string;
  readonly parentId?: string;
}

/** 子节点列表查询参数。 */
export interface DriveNodeListParams {
  readonly parentId: string;
  readonly limit: number;
  readonly cursor?: string;
}

/** 分页列表结果。 */
export interface DriveNodeListResult {
  readonly items: readonly DriveNodeSummary[];
  readonly nextCursor?: string;
}

export const DRIVE_NODE_SELECT =
  "id, created_by, parent_id, node_type, name, storage_key, mime_type, size_bytes, linked_task_id, deleted_at, created_at, updated_at";

export const DRIVE_NODE_SUMMARY_SELECT =
  "id, node_type, name, size_bytes, mime_type, linked_task_id, updated_at";

/** 虚拟根目录名称（`database.md` §7.2.1）。 */
export const DRIVE_ROOT_FOLDER_NAME = "__root__";

/**
 * 映射数据库行为 {@link DriveNodeRecord}。
 */
export function mapDriveNodeRow(row: DriveNodeRowDb): DriveNodeRecord {
  return {
    id: row.id,
    createdBy: row.created_by,
    parentId: row.parent_id,
    nodeType: row.node_type,
    name: row.name,
    storageKey: row.storage_key,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes != null ? Number(row.size_bytes) : null,
    linkedTaskId: row.linked_task_id,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * 映射列表摘要行。
 */
export function mapDriveNodeSummary(
  row: Pick<
    DriveNodeRowDb,
    | "id"
    | "node_type"
    | "name"
    | "size_bytes"
    | "mime_type"
    | "linked_task_id"
    | "updated_at"
  >,
  options?: { readonly isArchiveFolder?: boolean },
): DriveNodeSummary {
  return {
    id: row.id,
    nodeType: row.node_type,
    name: row.name,
    sizeBytes: row.size_bytes != null ? Number(row.size_bytes) : null,
    mimeType: row.mime_type,
    linkedTaskId: row.linked_task_id,
    isArchiveFolder: options?.isArchiveFolder,
    updatedAt: row.updated_at,
  };
}

/**
 * 编码子节点列表游标（按 `name` + `id` 升序分页）。
 */
export function encodeDriveNodeListCursor(name: string, id: string): string {
  const payload = JSON.stringify({ name, id });
  return Buffer.from(payload, "utf8").toString("base64url");
}

/**
 * 解码子节点列表游标。
 */
export function decodeDriveNodeListCursor(
  cursor: string,
): { name: string; id: string } {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as { name?: string; id?: string };
    if (typeof parsed.name !== "string" || typeof parsed.id !== "string") {
      throw new Error("Invalid drive node list cursor");
    }
    return { name: parsed.name, id: parsed.id };
  } catch {
    throw new Error("Invalid drive node list cursor");
  }
}
