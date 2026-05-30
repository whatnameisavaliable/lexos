import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseEnvConfig } from "@lexos/shared/config";
import {
  DRIVE_NODE_SELECT,
  DRIVE_NODE_SUMMARY_SELECT,
  DRIVE_ROOT_FOLDER_NAME,
  decodeDriveNodeListCursor,
  encodeDriveNodeListCursor,
  mapDriveNodeRow,
  mapDriveNodeSummary,
  type CreateDriveFolderInput,
  type DriveNodeListParams,
  type DriveNodeListResult,
  type DriveNodeRecord,
  type DriveNodeRowDb,
  type UpdateDriveNodeInput,
} from "./drive-node.types.js";

/**
 * 云盘节点仓储（用户 JWT + RLS；`database.md` §3.5 · §4.5）。
 */
export class DriveNodeRepository {
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  constructor(supabaseEnv: SupabaseEnvConfig) {
    this.supabaseUrl = supabaseEnv.supabaseUrl;
    this.supabaseAnonKey = supabaseEnv.supabaseAnonKey;
  }

  /**
   * 查找用户虚拟根目录（`__root__`）。
   */
  async findRootByUser(accessToken: string): Promise<DriveNodeRecord | null> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("drive_nodes")
      .select(DRIVE_NODE_SELECT)
      .is("parent_id", null)
      .eq("name", DRIVE_ROOT_FOLDER_NAME)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(`drive_nodes.findRootByUser failed: ${error.message}`);
    }
    return data ? mapDriveNodeRow(data as DriveNodeRowDb) : null;
  }

  /**
   * 创建用户虚拟根目录。
   */
  async createRootFolder(
    accessToken: string,
    userId: string,
  ): Promise<DriveNodeRecord> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("drive_nodes")
      .insert({
        created_by: userId,
        parent_id: null,
        node_type: "folder",
        name: DRIVE_ROOT_FOLDER_NAME,
      })
      .select(DRIVE_NODE_SELECT)
      .single();

    if (error) {
      throw new Error(`drive_nodes.createRootFolder failed: ${error.message}`);
    }
    return mapDriveNodeRow(data as DriveNodeRowDb);
  }

  /**
   * 分页列出指定父目录下的子节点（不含 `__root__` 自身）。
   */
  async listChildren(
    accessToken: string,
    params: DriveNodeListParams,
  ): Promise<DriveNodeListResult> {
    const client = this.userClient(accessToken);
    let query = client
      .from("drive_nodes")
      .select(DRIVE_NODE_SUMMARY_SELECT)
      .eq("parent_id", params.parentId)
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .order("id", { ascending: true })
      .limit(params.limit + 1);

    if (params.cursor) {
      const { name, id } = decodeDriveNodeListCursor(params.cursor);
      query = query.or(
        `name.gt.${escapePostgrestValue(name)},and(name.eq.${escapePostgrestValue(name)},id.gt.${id})`,
      );
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`drive_nodes.listChildren failed: ${error.message}`);
    }

    const rows = (data ?? []) as Array<
      Pick<
        DriveNodeRowDb,
        | "id"
        | "node_type"
        | "name"
        | "size_bytes"
        | "mime_type"
        | "linked_task_id"
        | "updated_at"
      >
    >;

    const hasMore = rows.length > params.limit;
    const pageRows = hasMore ? rows.slice(0, params.limit) : rows;
    const last = pageRows.at(-1);

    return {
      items: pageRows.map((row) =>
        mapDriveNodeSummary(row, {
          isArchiveFolder: row.linked_task_id != null && row.node_type === "folder",
        }),
      ),
      nextCursor:
        hasMore && last
          ? encodeDriveNodeListCursor(last.name, last.id)
          : undefined,
    };
  }

  /**
   * 按 id 查询节点（RLS 限制可见范围）。
   */
  async findById(
    accessToken: string,
    nodeId: string,
  ): Promise<DriveNodeRecord | null> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("drive_nodes")
      .select(DRIVE_NODE_SELECT)
      .eq("id", nodeId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(`drive_nodes.findById failed: ${error.message}`);
    }
    return data ? mapDriveNodeRow(data as DriveNodeRowDb) : null;
  }

  /**
   * 统计未删除子节点数量。
   */
  async countActiveChildren(
    accessToken: string,
    parentId: string,
  ): Promise<number> {
    const client = this.userClient(accessToken);
    const { count, error } = await client
      .from("drive_nodes")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", parentId)
      .is("deleted_at", null);

    if (error) {
      throw new Error(`drive_nodes.countActiveChildren failed: ${error.message}`);
    }
    return count ?? 0;
  }

  /**
   * 创建子文件夹。
   */
  async createFolder(
    accessToken: string,
    input: CreateDriveFolderInput,
  ): Promise<DriveNodeRecord> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("drive_nodes")
      .insert({
        created_by: input.createdBy,
        parent_id: input.parentId,
        node_type: "folder",
        name: input.name,
      })
      .select(DRIVE_NODE_SELECT)
      .single();

    if (error) {
      throw new Error(`drive_nodes.createFolder failed: ${error.message}`);
    }
    return mapDriveNodeRow(data as DriveNodeRowDb);
  }

  /**
   * 更新节点（重命名 / 移动）。
   */
  async updateNode(
    accessToken: string,
    nodeId: string,
    input: UpdateDriveNodeInput,
  ): Promise<DriveNodeRecord> {
    const client = this.userClient(accessToken);
    const payload: Record<string, unknown> = {};
    if (input.name !== undefined) {
      payload.name = input.name;
    }
    if (input.parentId !== undefined) {
      payload.parent_id = input.parentId;
    }

    const { data, error } = await client
      .from("drive_nodes")
      .update(payload)
      .eq("id", nodeId)
      .is("deleted_at", null)
      .select(DRIVE_NODE_SELECT)
      .single();

    if (error) {
      throw new Error(`drive_nodes.updateNode failed: ${error.message}`);
    }
    return mapDriveNodeRow(data as DriveNodeRowDb);
  }

  /**
   * 软删除节点。
   */
  async softDelete(
    accessToken: string,
    nodeId: string,
  ): Promise<DriveNodeRecord | null> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("drive_nodes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", nodeId)
      .is("deleted_at", null)
      .select(DRIVE_NODE_SELECT)
      .maybeSingle();

    if (error) {
      throw new Error(`drive_nodes.softDelete failed: ${error.message}`);
    }
    return data ? mapDriveNodeRow(data as DriveNodeRowDb) : null;
  }

  /**
   * 列出从某节点到根的祖先 id（含自身），用于移动环检测。
   */
  async listAncestorIds(
    accessToken: string,
    nodeId: string,
    maxDepth = 64,
  ): Promise<readonly string[]> {
    const ids: string[] = [];
    let currentId: string | null = nodeId;

    for (let depth = 0; depth < maxDepth && currentId; depth += 1) {
      ids.push(currentId);
      const node = await this.findById(accessToken, currentId);
      if (!node?.parentId) {
        break;
      }
      currentId = node.parentId;
    }

    return ids;
  }

  private userClient(accessToken: string): SupabaseClient {
    return createClient(this.supabaseUrl, this.supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
}

/** 转义 PostgREST filter 值中的特殊字符。 */
function escapePostgrestValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,");
}
