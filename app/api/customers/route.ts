import { handleApiError, ok, readJsonObject } from "@/lib/api/http";
import { normalizedQueryParam, paginationMeta, parseListQuery, parseListSort, postgrestLikePattern } from "@/lib/api/pagination";
import { getAuditRequestContext, writeAuditLog } from "@/lib/audit/log";
import { requireInternalSession } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadSystemSettingNumber } from "@/lib/settings/runtime";
import { validateCreateCustomerInput } from "@/lib/workflow/validation";
import { isLawyerRole, type UserRole } from "@/lib/domain/core";

const customerReadRoles: UserRole[] = ["director", "lawyer"];
const customerWriteRoles: UserRole[] = ["lawyer"];
const customerSortOptions = {
  createdAtAsc: { ascending: true, column: "created_at" },
  createdAtDesc: { ascending: false, column: "created_at" },
  nameAsc: { ascending: true, column: "name" },
  sourceAsc: { ascending: true, column: "source" },
  statusAsc: { ascending: true, column: "status" },
};

export async function GET(request: Request) {
  try {
    const session = await requireInternalSession(customerReadRoles);
    const admin = createSupabaseAdminClient();
    const defaultPageSize = await loadSystemSettingNumber(admin, session.organizationId, "default_page_size");
    const listQuery = parseListQuery(request, { defaultPageSize });
    const sort = parseListSort(request, customerSortOptions, "createdAtDesc");
    const status = normalizedQueryParam(request, "status");
    const searchPattern = postgrestLikePattern(listQuery.search);
    let query = admin
      .from("customers")
      .select("id, name, contact_name, phone, source, status, created_at, created_by", { count: "exact" })
      .eq("organization_id", session.organizationId)
      .order(sort.column, { ascending: sort.ascending });

    if (isLawyerRole(session.roleCode)) {
      query = query.eq("created_by", session.userId);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (searchPattern) {
      query = query.or(
        [
          `name.ilike.${searchPattern}`,
          `contact_name.ilike.${searchPattern}`,
          `phone.ilike.${searchPattern}`,
          `source.ilike.${searchPattern}`,
        ].join(","),
      );
    }

    const { data, error, count } = await query.range(listQuery.from, listQuery.to);

    if (error) {
      throw error;
    }

    return ok({ customers: data ?? [], pagination: paginationMeta(listQuery, count) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireInternalSession(customerWriteRoles);
    const body = await readJsonObject(request);
    const input = validateCreateCustomerInput({
      name: body.name,
      contactName: body.contactName,
      phone: body.phone,
      source: body.source,
    });
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("customers")
      .insert({
        organization_id: session.organizationId,
        name: input.name,
        contact_name: input.contactName,
        phone: input.phone,
        source: input.source,
        created_by: session.userId,
      })
      .select("id, name, contact_name, phone, source, status, created_at")
      .single();

    if (error) {
      throw error;
    }

    await writeAuditLog(admin, {
      organizationId: session.organizationId,
      actorUserId: session.userId,
      action: "customers.create",
      entityType: "customers",
      entityId: data.id,
      metadata: { name: input.name, source: input.source },
      ...getAuditRequestContext(request),
    });

    return ok({ customer: data }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
