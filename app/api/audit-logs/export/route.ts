import { NextResponse } from "next/server";

import { normalizedDateBoundary } from "@/lib/api/date-range";
import { normalizedQueryParam, postgrestLikePattern } from "@/lib/api/pagination";
import { auditLogsToCsv } from "@/lib/audit/log";
import { requireInternalSession } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/http";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const session = await requireInternalSession(["system_admin", "firm_admin"]);
    const admin = createSupabaseAdminClient();
    const action = normalizedQueryParam(request, "action");
    const entityType = normalizedQueryParam(request, "entityType");
    const startDate = normalizedDateBoundary(normalizedQueryParam(request, "startDate"), "start");
    const endDate = normalizedDateBoundary(normalizedQueryParam(request, "endDate"), "end");
    const searchPattern = postgrestLikePattern(
      normalizedQueryParam(request, "search") ?? normalizedQueryParam(request, "keyword"),
    );
    let query = admin
      .from("audit_logs")
      .select("id, actor_user_id, action, entity_type, entity_id, metadata, ip_address, user_agent, created_at")
      .eq("organization_id", session.organizationId)
      .order("created_at", { ascending: false })
      .limit(1000);

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

    const { data: logs, error } = await query;

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

    const csv = auditLogsToCsv(
      (logs ?? []).map((log) => {
        const actor = log.actor_user_id ? profilesById.get(log.actor_user_id) : undefined;

        return {
          action: log.action ?? "",
          actorDisplayName: actor?.display_name,
          actorUsername: actor?.username,
          createdAt: log.created_at ?? "",
          entityId: log.entity_id ?? undefined,
          entityType: log.entity_type ?? "",
          ipAddress: log.ip_address ?? undefined,
          metadata: log.metadata as Record<string, unknown> | null,
          userAgent: log.user_agent ?? undefined,
        };
      }),
    );
    const filename = `lexos-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      headers: {
        "content-disposition": `attachment; filename="${filename}"`,
        "content-type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
