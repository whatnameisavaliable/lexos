import { ApiError, handleApiError, ok, readJsonObject } from "@/lib/api/http";
import {
  normalizedQueryParam,
  paginationMeta,
  parseListQuery,
  parseListSort,
  postgrestLikePattern,
} from "@/lib/api/pagination";
import { getAuditRequestContext, writeAuditLog } from "@/lib/audit/log";
import { requireInternalSession } from "@/lib/auth/session";
import type { UserRole } from "@/lib/domain/core";
import { normalizeRiskCaseInput } from "@/lib/risk/cases";
import { enrichRiskCases, type RiskCaseRow } from "@/lib/risk/records";
import { loadSystemSettingNumber } from "@/lib/settings/runtime";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const riskReadRoles: UserRole[] = ["system_admin", "firm_admin", "director", "source_lawyer", "handling_lawyer"];
const riskCreateRoles: UserRole[] = ["system_admin", "firm_admin", "director", "source_lawyer"];
const riskCaseSelect =
  "id, organization_id, task_id, customer_id, reported_by_user_id, owner_user_id, source, severity, status, title, description, resolution_note, defense_statement, defended_at, committee_decision, committee_decision_note, committee_deduction_basis_points, committee_decided_by, committee_decided_at, resolved_at, created_at, updated_at";
const riskSortOptions = {
  createdAtAsc: { ascending: true, column: "created_at" },
  createdAtDesc: { ascending: false, column: "created_at" },
  severityAsc: { ascending: true, column: "severity" },
  statusAsc: { ascending: true, column: "status" },
};

export async function GET(request: Request) {
  try {
    const session = await requireInternalSession(riskReadRoles);
    const admin = createSupabaseAdminClient();
    const defaultPageSize = await loadSystemSettingNumber(admin, session.organizationId, "default_page_size");
    const listQuery = parseListQuery(request, { defaultPageSize });
    const sort = parseListSort(request, riskSortOptions, "createdAtDesc");
    const status = normalizedQueryParam(request, "status");
    const severity = normalizedQueryParam(request, "severity");
    const source = normalizedQueryParam(request, "source");
    const searchPattern = postgrestLikePattern(listQuery.search);
    let assignedTaskIds: string[] = [];

    if (session.roleCode === "handling_lawyer") {
      const { data: assignedTasks, error: assignedTasksError } = await admin
        .from("tasks")
        .select("id")
        .eq("organization_id", session.organizationId)
        .eq("assigned_lawyer_id", session.userId)
        .limit(1000);

      if (assignedTasksError) {
        throw assignedTasksError;
      }

      assignedTaskIds = (assignedTasks ?? []).map((task) => task.id);

      if (!assignedTaskIds.length) {
        return ok({ pagination: paginationMeta(listQuery, 0), riskCases: [] });
      }
    }

    let query = admin
      .from("risk_cases")
      .select(riskCaseSelect, { count: "exact" })
      .eq("organization_id", session.organizationId)
      .order(sort.column, { ascending: sort.ascending });

    if (session.roleCode === "source_lawyer") {
      query = query.eq("reported_by_user_id", session.userId);
    }

    if (session.roleCode === "handling_lawyer") {
      query = query.in("task_id", assignedTaskIds);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (severity && severity !== "all") {
      query = query.eq("severity", severity);
    }

    if (source && source !== "all") {
      query = query.eq("source", source);
    }

    if (searchPattern) {
      query = query.or(
        [
          `title.ilike.${searchPattern}`,
          `description.ilike.${searchPattern}`,
          `source.ilike.${searchPattern}`,
          `severity.ilike.${searchPattern}`,
          `status.ilike.${searchPattern}`,
        ].join(","),
      );
    }

    const { data, error, count } = await query.range(listQuery.from, listQuery.to);

    if (error) {
      throw error;
    }

    const cases = await enrichRiskCases(admin, (data ?? []) as RiskCaseRow[]);

    return ok({ pagination: paginationMeta(listQuery, count), riskCases: cases });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireInternalSession(riskCreateRoles);
    const input = normalizeRiskCaseInput(await readJsonObject(request));
    const admin = createSupabaseAdminClient();
    let customerId = input.customerId;

    if (input.taskId) {
      const { data: task, error: taskError } = await admin
        .from("tasks")
        .select("id, title, customer_id, source_lawyer_id")
        .eq("id", input.taskId)
        .eq("organization_id", session.organizationId)
        .maybeSingle();

      if (taskError) {
        throw taskError;
      }

      if (!task) {
        throw new ApiError(404, "NOT_FOUND", "关联任务不存在");
      }

      if (session.roleCode === "source_lawyer" && task.source_lawyer_id !== session.userId) {
        throw new ApiError(403, "FORBIDDEN", "案源律师只能登记自己任务相关的风控工单");
      }

      customerId = customerId ?? task.customer_id ?? undefined;
    }

    if (customerId) {
      const { data: customer, error: customerError } = await admin
        .from("customers")
        .select("id")
        .eq("id", customerId)
        .eq("organization_id", session.organizationId)
        .maybeSingle();

      if (customerError) {
        throw customerError;
      }

      if (!customer) {
        throw new ApiError(404, "NOT_FOUND", "关联客户不存在");
      }
    }

    const { data, error } = await admin
      .from("risk_cases")
      .insert({
        organization_id: session.organizationId,
        task_id: input.taskId,
        customer_id: customerId,
        reported_by_user_id: session.userId,
        owner_user_id: input.ownerUserId,
        source: input.source,
        severity: input.severity,
        status: input.status,
        title: input.title,
        description: input.description,
      })
      .select(riskCaseSelect)
      .single();

    if (error) {
      throw error;
    }

    await writeAuditLog(admin, {
      organizationId: session.organizationId,
      actorUserId: session.userId,
      action: "risk_cases.create",
      entityType: "risk_cases",
      entityId: data.id,
      metadata: {
        severity: input.severity,
        source: input.source,
        status: input.status,
        taskId: input.taskId,
      },
      ...getAuditRequestContext(request),
    });

    const [riskCase] = await enrichRiskCases(admin, [data as RiskCaseRow]);

    return ok({ riskCase }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
