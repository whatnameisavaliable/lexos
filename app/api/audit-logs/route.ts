import { handleApiError, ok } from "@/lib/api/http";
import { normalizedDateBoundary } from "@/lib/api/date-range";
import { normalizedQueryParam, paginationMeta, parseListQuery, parseListSort, postgrestLikePattern } from "@/lib/api/pagination";
import { requireInternalSession } from "@/lib/auth/session";
import { loadSystemSettingNumber } from "@/lib/settings/runtime";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const auditLogSortOptions = {
  actionAsc: { ascending: true, column: "action" },
  createdAtAsc: { ascending: true, column: "created_at" },
  createdAtDesc: { ascending: false, column: "created_at" },
  entityTypeAsc: { ascending: true, column: "entity_type" },
};

export async function GET(request: Request) {
  try {
    const session = await requireInternalSession(["system_admin", "firm_admin"]);
    const admin = createSupabaseAdminClient();
    const defaultPageSize = await loadSystemSettingNumber(admin, session.organizationId, "default_page_size");
    const listQuery = parseListQuery(request, { defaultPageSize });
    const sort = parseListSort(request, auditLogSortOptions, "createdAtDesc");
    const action = normalizedQueryParam(request, "action");
    const entityType = normalizedQueryParam(request, "entityType");
    const startDate = normalizedDateBoundary(normalizedQueryParam(request, "startDate"), "start");
    const endDate = normalizedDateBoundary(normalizedQueryParam(request, "endDate"), "end");
    const searchPattern = postgrestLikePattern(listQuery.search);
    let query = admin
      .from("audit_logs")
      .select("id, actor_user_id, action, entity_type, entity_id, metadata, created_at", { count: "exact" })
      .eq("organization_id", session.organizationId)
      .order(sort.column, { ascending: sort.ascending });

    if (action && action !== "all") {
      query = query.eq("action", action);
    }

    if (entityType && entityType !== "all") {
      query = query.eq("entity_type", entityType);
    }

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    if (searchPattern) {
      query = query.or(
        [`action.ilike.${searchPattern}`, `entity_type.ilike.${searchPattern}`, `entity_id.ilike.${searchPattern}`].join(","),
      );
    }

    const { data: logs, error, count } = await query.range(listQuery.from, listQuery.to);

    if (error) {
      throw error;
    }

    const actorIds = Array.from(
      new Set((logs ?? []).map((log) => log.actor_user_id).filter((id): id is string => Boolean(id))),
    );
    const profilesById = new Map<string, { id: string; username: string; display_name: string }>();

    if (actorIds.length) {
      const { data: profiles, error: profileError } = await admin
        .from("profiles")
        .select("id, username, display_name")
        .in("id", actorIds);

      if (profileError) {
        throw profileError;
      }

      for (const profile of profiles ?? []) {
        profilesById.set(profile.id, profile);
      }
    }

    return ok({
      logs: (logs ?? []).map((log) => ({
        ...log,
        actor: log.actor_user_id ? profilesById.get(log.actor_user_id) ?? null : null,
      })),
      pagination: paginationMeta(listQuery, count),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
