import type { PoolClient } from "pg";

/** 归档目录创建入参。 */
export interface CreateArchiveFolderInput {
  readonly userId: string;
  readonly taskId: string;
  readonly title: string;
}

/** 归档文件引用入参。 */
export interface EnsureArchiveFileRefInput {
  readonly userId: string;
  readonly folderId: string;
  readonly taskId: string;
  readonly name: string;
  readonly storageKey: string;
  readonly mimeType: string;
  readonly sizeBytes: number | null;
}

/**
 * Worker 云盘归档目录（`database.md` §7.2.2 · `YYYY-MM-DD/title/`）。
 */
export class WorkerDriveRepository {
  /** 在用户云盘根下创建日期/任务文件夹并返回任务文件夹 id。 */
  async createArchiveFolder(
    client: PoolClient,
    input: CreateArchiveFolderInput,
  ): Promise<string> {
    const rootId = await this.findRootFolderId(client, input.userId);
    const dateName = formatArchiveDate(new Date());
    const dateFolderId = await this.ensureFolder(
      client,
      input.userId,
      rootId,
      dateName,
    );
    return this.ensureFolder(
      client,
      input.userId,
      dateFolderId,
      sanitizeFolderName(input.title),
      input.taskId,
    );
  }

  private async findRootFolderId(
    client: PoolClient,
    userId: string,
  ): Promise<string> {
    const result = await client.query<{ id: string }>(
      `SELECT id
       FROM public.drive_nodes
       WHERE created_by = $1::uuid
         AND parent_id IS NULL
         AND name = '__root__'
         AND deleted_at IS NULL
       LIMIT 1`,
      [userId],
    );
    const id = result.rows[0]?.id;
    if (!id) {
      throw new Error(`drive root folder not found for user ${userId}`);
    }
    return id;
  }

  private async ensureFolder(
    client: PoolClient,
    userId: string,
    parentId: string,
    name: string,
    linkedTaskId?: string,
  ): Promise<string> {
    const existing = await client.query<{ id: string }>(
      `SELECT id
       FROM public.drive_nodes
       WHERE created_by = $1::uuid
         AND parent_id = $2::uuid
         AND name = $3
         AND deleted_at IS NULL
       LIMIT 1`,
      [userId, parentId, name],
    );
    const found = existing.rows[0]?.id;
    if (found) {
      return found;
    }

    const inserted = await client.query<{ id: string }>(
      `INSERT INTO public.drive_nodes (
         created_by,
         parent_id,
         node_type,
         name,
         linked_task_id
       ) VALUES ($1::uuid, $2::uuid, 'folder', $3, $4::uuid)
       RETURNING id`,
      [userId, parentId, name, linkedTaskId ?? null],
    );
    const id = inserted.rows[0]?.id;
    if (!id) {
      throw new Error("drive_nodes.insert folder failed");
    }
    return id;
  }

  /**
   * 写入归档文件引用（幂等；`database.md` §6.3.1）。
   */
  async ensureArchiveFileRef(
    client: PoolClient,
    input: EnsureArchiveFileRefInput,
  ): Promise<void> {
    const existing = await client.query<{ id: string }>(
      `SELECT id
       FROM public.drive_nodes
       WHERE created_by = $1::uuid
         AND parent_id = $2::uuid
         AND storage_key = $3
         AND node_type = 'file'
         AND deleted_at IS NULL
       LIMIT 1`,
      [input.userId, input.folderId, input.storageKey],
    );
    if (existing.rows[0]?.id) {
      return;
    }

    const inserted = await client.query<{ id: string }>(
      `INSERT INTO public.drive_nodes (
         created_by,
         parent_id,
         node_type,
         name,
         storage_key,
         mime_type,
         size_bytes,
         linked_task_id
       ) VALUES ($1::uuid, $2::uuid, 'file', $3, $4, $5, $6, $7::uuid)
       RETURNING id`,
      [
        input.userId,
        input.folderId,
        input.name,
        input.storageKey,
        input.mimeType,
        input.sizeBytes,
        input.taskId,
      ],
    );
    if (!inserted.rows[0]?.id) {
      throw new Error("drive_nodes.insert file failed");
    }
  }
}

function formatArchiveDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sanitizeFolderName(title: string): string {
  const trimmed = title.trim().slice(0, 200);
  const sanitized = trimmed.replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, " ");
  return sanitized.length > 0 ? sanitized : "untitled";
}
