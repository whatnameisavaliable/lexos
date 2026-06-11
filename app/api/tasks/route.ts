import { ApiError, handleApiError, ok, readJsonObject } from "@/lib/api/http";
import {
  normalizedQueryParam,
  paginationMeta,
  parseListQuery,
  parseListSort,
  postgrestInFilter,
  postgrestLikePattern,
} from "@/lib/api/pagination";
import { getAuditRequestContext, writeAuditLog } from "@/lib/audit/log";
import { requireInternalSession } from "@/lib/auth/session";
import type { UserRole } from "@/lib/domain/core";
import { loadSystemSettingNumber } from "@/lib/settings/runtime";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildPortalToken, buildPortalTokenHash, validateCreateTaskInput } from "@/lib/workflow/validation";

const taskReadRoles: UserRole[] = ["system_admin", "firm_admin", "director", "source_lawyer", "handling_lawyer", "finance"];
const taskCreateRoles: UserRole[] = ["system_admin", "firm_admin", "source_lawyer"];
const taskSortOptions = {
  amountDesc: { ascending: false, column: "amount_cents" },
  createdAtAsc: { ascending: true, column: "created_at" },
  createdAtDesc: { ascending: false, column: "created_at" },
  dueAtAsc: { ascending: true, column: "due_at" },
  statusAsc: { ascending: true, column: "status" },
};

export async function GET(request: Request) {
  try {
    const session = await requireInternalSession(taskReadRoles);
    const admin = createSupabaseAdminClient();
    const defaultPageSize = await loadSystemSettingNumber(admin, session.organizationId, "default_page_size");
    const listQuery = parseListQuery(request, { defaultPageSize });
    const sort = parseListSort(request, taskSortOptions, "createdAtDesc");
    const status = normalizedQueryParam(request, "status");
    const minRankId = normalizedQueryParam(request, "minRankId");
    const scope = normalizedQueryParam(request, "scope");
    const searchPattern = postgrestLikePattern(listQuery.search);
    let matchedCustomerIds: string[] = [];

    if (searchPattern) {
      const { data: customers, error: customerSearchError } = await admin
        .from("customers")
        .select("id")
        .eq("organization_id", session.organizationId)
        .or([`name.ilike.${searchPattern}`, `contact_name.ilike.${searchPattern}`, `phone.ilike.${searchPattern}`].join(","))
        .limit(200);

      if (customerSearchError) {
        throw customerSearchError;
      }

      matchedCustomerIds = (customers ?? []).map((customer) => customer.id);
    }

    let query = admin
      .from("tasks")
      .select(
        "id, customer_id, title, description, task_type, amount_cents, min_rank_id, source_lawyer_id, assigned_lawyer_id, status, due_at, created_at, submitted_at, approved_at, review_required, review_status, review_lawyer_id, reviewed_at, review_comment, source_review_score, source_review_comment, source_reviewed_at, case_result_score, case_result_summary, customer_confirmed_at, customers:customer_id!inner(id, name, phone), task_deliverables(id, title, content, external_url, submitted_at, file_name, file_size_bytes, file_mime_type)",
        { count: "exact" },
      )
      .eq("organization_id", session.organizationId)
      .order(sort.column, { ascending: sort.ascending });

    if (session.roleCode === "source_lawyer") {
      query = query.eq("source_lawyer_id", session.userId);
    }

    if (session.roleCode === "director") {
      query = query.eq("review_required", true).or(`review_lawyer_id.is.null,review_lawyer_id.eq.${session.userId}`);
    }

    if (session.roleCode === "handling_lawyer" && scope === "assigned") {
      query = query.eq("assigned_lawyer_id", session.userId);
    } else if (session.roleCode === "handling_lawyer") {
      query = query.or(`status.eq.open,assigned_lawyer_id.eq.${session.userId}`);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (minRankId && minRankId !== "all") {
      query = query.eq("min_rank_id", minRankId);
    }

    if (searchPattern) {
      const filters = [
        `title.ilike.${searchPattern}`,
        `description.ilike.${searchPattern}`,
        `task_type.ilike.${searchPattern}`,
        `status.ilike.${searchPattern}`,
      ];
      const customerFilter = postgrestInFilter(matchedCustomerIds);

      if (customerFilter) {
        filters.push(`customer_id.in.${customerFilter}`);
      }

      query = query.or(filters.join(","));
    }

    const { data, error, count } = await query.range(listQuery.from, listQuery.to);

    if (error) {
      throw error;
    }

    return ok({ pagination: paginationMeta(listQuery, count), tasks: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireInternalSession(taskCreateRoles);
    const body = await readJsonObject(request);
    const input = validateCreateTaskInput({
      customerId: body.customerId,
      title: body.title,
      description: body.description,
      taskType: body.taskType,
      amountYuan: body.amountYuan,
      amountCents: body.amountCents,
      minRankId: body.minRankId,
      dueAt: body.dueAt,
      reviewLawyerId: body.reviewLawyerId,
      reviewRequired: body.reviewRequired,
    });
    const admin = createSupabaseAdminClient();

    const { data: customer, error: customerError } = await admin
      .from("customers")
      .select("id, phone")
      .eq("id", input.customerId)
      .eq("organization_id", session.organizationId)
      .maybeSingle();

    if (customerError) {
      throw customerError;
    }

    if (!customer) {
      throw new ApiError(404, "NOT_FOUND", "客户不存在");
    }

    const { data: task, error: taskError } = await admin
      .from("tasks")
      .insert({
        organization_id: session.organizationId,
        customer_id: input.customerId,
        title: input.title,
        description: input.description,
        task_type: input.taskType,
        amount_cents: input.amountCents,
        min_rank_id: input.minRankId,
        due_at: input.dueAt,
        review_lawyer_id: input.reviewRequired ? input.reviewLawyerId ?? null : null,
        review_required: input.reviewRequired,
        review_status: input.reviewRequired ? "pending" : "not_required",
        source_lawyer_id: session.userId,
        status: "open",
      })
      .select("id, title, amount_cents, status")
      .single();

    if (taskError) {
      throw taskError;
    }

    const portalToken = buildPortalToken();
    const { error: portalError } = await admin.from("customer_portal_links").insert({
      organization_id: session.organizationId,
      task_id: task.id,
      customer_id: input.customerId,
      token_hash: buildPortalTokenHash(portalToken),
      phone: customer.phone ?? "",
      status: "active",
    });

    if (portalError) {
      throw portalError;
    }

    await writeAuditLog(admin, {
      organizationId: session.organizationId,
      actorUserId: session.userId,
      action: "tasks.create",
      entityType: "tasks",
      entityId: task.id,
      metadata: {
        title: input.title,
        customerId: input.customerId,
        amountCents: input.amountCents,
        reviewRequired: input.reviewRequired,
      },
      ...getAuditRequestContext(request),
    });

    return ok({ task, portalToken }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
