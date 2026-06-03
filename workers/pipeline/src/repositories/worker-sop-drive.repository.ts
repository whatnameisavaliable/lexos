import type { PoolClient } from "pg";

/** SOP PDF 云盘链接入参。 */
export interface LinkSopPdfDriveNodeInput {
  readonly ownerId: string;
  readonly pipelineId: string;
  readonly artifactId: string;
  readonly storageKey: string;
  readonly pdfFileName: string;
}

/**
 * Worker 侧 SOP PDF 云盘节点写入（`exports` 桶对象引用）。
 */
export class WorkerSopDriveRepository {
  /**
   * 在用户云盘创建/复用 SOP PDF 文件节点并返回 `drive_nodes.id`。
   */
  async linkPdfToDriveNode(
    client: PoolClient,
    input: LinkSopPdfDriveNodeInput,
  ): Promise<string> {
    const rootId = await this.findRootFolderId(client, input.ownerId);
    const sopFolderId = await this.ensureFolder(
      client,
      input.ownerId,
      rootId,
      "SOP",
    );
    const pipelineFolderId = await this.ensureFolder(
      client,
      input.ownerId,
      sopFolderId,
      input.pipelineId,
    );

    const existing = await client.query<{ id: string }>(
      `SELECT id
       FROM public.drive_nodes
       WHERE created_by = $1::uuid
         AND parent_id = $2::uuid
         AND storage_key = $3
         AND node_type = 'file'
         AND deleted_at IS NULL
       LIMIT 1`,
      [input.ownerId, pipelineFolderId, input.storageKey],
    );
    if (existing.rows[0]?.id) {
      return existing.rows[0].id;
    }

    const inserted = await client.query<{ id: string }>(
      `INSERT INTO public.drive_nodes (
         created_by,
         parent_id,
         node_type,
         name,
         storage_key,
         mime_type
       ) VALUES ($1::uuid, $2::uuid, 'file', $3, $4, 'application/pdf')
       RETURNING id`,
      [
        input.ownerId,
        pipelineFolderId,
        input.pdfFileName,
        input.storageKey,
      ],
    );
    const id = inserted.rows[0]?.id;
    if (!id) {
      throw new Error("drive_nodes.insert SOP PDF failed");
    }
    return id;
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
         name
       ) VALUES ($1::uuid, $2::uuid, 'folder', $3)
       RETURNING id`,
      [userId, parentId, name],
    );
    const id = inserted.rows[0]?.id;
    if (!id) {
      throw new Error("drive_nodes.insert folder failed");
    }
    return id;
  }
}
