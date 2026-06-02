import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseEnvConfig } from "@lexos/shared/config";
import {
  DRIVE_NODE_SELECT,
  mapDriveNodeRow,
  type DriveNodeRecord,
  type DriveNodeRowDb,
} from "./drive-node.types.js";

/**
 * 管理员跨用户云盘操作（`service_role`；仅删除等管理动作，PRD-3.6-02）。
 */
export class DriveNodeAdminRepository {
  private readonly serviceClient: SupabaseClient;

  constructor(supabaseEnv: SupabaseEnvConfig) {
    this.serviceClient = createClient(
      supabaseEnv.supabaseUrl,
      supabaseEnv.supabaseServiceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }

  async findById(nodeId: string): Promise<DriveNodeRecord | null> {
    const { data, error } = await this.serviceClient
      .from("drive_nodes")
      .select(DRIVE_NODE_SELECT)
      .eq("id", nodeId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(`drive_nodes.admin.findById failed: ${error.message}`);
    }
    return data ? mapDriveNodeRow(data as DriveNodeRowDb) : null;
  }

  /** 软删除节点及其全部未删除子节点；返回删除行数（含根节点）。 */
  async softDeleteSubtree(nodeId: string): Promise<number> {
    const ids = await this.collectSubtreeNodeIds(nodeId);
    if (ids.length === 0) {
      return 0;
    }

    const deletedAt = new Date().toISOString();
    const { error } = await this.serviceClient
      .from("drive_nodes")
      .update({ deleted_at: deletedAt, updated_at: deletedAt })
      .in("id", ids)
      .is("deleted_at", null);

    if (error) {
      throw new Error(
        `drive_nodes.admin.softDeleteSubtree failed: ${error.message}`,
      );
    }

    return ids.length;
  }

  private async collectSubtreeNodeIds(rootId: string): Promise<string[]> {
    const ids: string[] = [];
    const queue = [rootId];

    while (queue.length > 0) {
      const id = queue.shift();
      if (!id) {
        break;
      }
      ids.push(id);

      const node = await this.findById(id);
      if (node?.nodeType !== "folder") {
        continue;
      }

      let offset = 0;
      const pageSize = 200;
      for (;;) {
        const { data, error } = await this.serviceClient
          .from("drive_nodes")
          .select("id")
          .eq("parent_id", id)
          .is("deleted_at", null)
          .order("id", { ascending: true })
          .range(offset, offset + pageSize - 1);

        if (error) {
          throw new Error(
            `drive_nodes.admin.listChildren failed: ${error.message}`,
          );
        }

        const rows = data ?? [];
        for (const row of rows) {
          queue.push(row.id as string);
        }
        if (rows.length < pageSize) {
          break;
        }
        offset += pageSize;
      }
    }

    return ids;
  }
}
