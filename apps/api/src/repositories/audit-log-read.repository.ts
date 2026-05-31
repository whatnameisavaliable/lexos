import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AuditLogsQuery } from "@lexos/shared";
import type { SupabaseEnvConfig } from "@lexos/shared/config";
import {
  mapAuditLogRow,
  type AuditLogListResult,
  type AuditLogRowDb,
} from "./audit-log-read.types.js";

const AUDIT_LOG_SELECT =
  "id, actor_id, action, target_type, target_id, ip_address, user_agent, metadata, row_hash, created_at";

function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}|${id}`, "utf8").toString("base64url");
}

function decodeCursor(cursor: string): { createdAt: string; id: string } {
  const decoded = Buffer.from(cursor, "base64url").toString("utf8");
  const sep = decoded.indexOf("|");
  if (sep < 0) {
    throw new Error("Invalid audit log cursor");
  }
  return { createdAt: decoded.slice(0, sep), id: decoded.slice(sep + 1) };
}

/**
 * 审计日志只读仓储（admin JWT + RLS `audit_select_admin`；`database.md` §4.7）。
 */
export class AuditLogReadRepository {
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  constructor(supabaseEnv: SupabaseEnvConfig) {
    this.supabaseUrl = supabaseEnv.supabaseUrl;
    this.supabaseAnonKey = supabaseEnv.supabaseAnonKey;
  }

  /**
   * 分页列表（`created_at DESC`）。
   */
  async list(
    accessToken: string,
    query: AuditLogsQuery,
  ): Promise<AuditLogListResult> {
    const fetchLimit = query.limit + 1;
    let builder = this.userClient(accessToken)
      .from("audit_logs")
      .select(AUDIT_LOG_SELECT)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (query.action) {
      builder = builder.eq("action", query.action);
    }
    if (query.actorId) {
      builder = builder.eq("actor_id", query.actorId);
    }
    if (query.targetType) {
      builder = builder.eq("target_type", query.targetType);
    }
    if (query.from) {
      builder = builder.gte("created_at", query.from);
    }
    if (query.to) {
      builder = builder.lte("created_at", query.to);
    }
    if (query.cursor) {
      const { createdAt, id } = decodeCursor(query.cursor);
      builder = builder.or(
        `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`,
      );
    }

    const { data, error } = await builder.limit(fetchLimit);
    if (error) {
      throw new Error(`audit_logs.list failed: ${error.message}`);
    }

    const rows = (data ?? []) as AuditLogRowDb[];
    const hasMore = rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;
    let nextCursor: string | undefined;
    if (hasMore && pageRows.length > 0) {
      const last = pageRows[pageRows.length - 1]!;
      nextCursor = encodeCursor(last.created_at, last.id);
    }

    return {
      items: pageRows.map(mapAuditLogRow),
      nextCursor,
    };
  }

  /**
   * 按 ID 查询单条（RLS 限制 admin）。
   */
  async getById(
    accessToken: string,
    id: string,
  ): Promise<AuditLogRowDb | null> {
    const { data, error } = await this.userClient(accessToken)
      .from("audit_logs")
      .select(AUDIT_LOG_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`audit_logs.getById failed: ${error.message}`);
    }
    return data ? (data as AuditLogRowDb) : null;
  }

  private userClient(accessToken: string): SupabaseClient {
    return createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }
}
