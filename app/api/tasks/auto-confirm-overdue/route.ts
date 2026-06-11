import { handleApiError, ok } from "@/lib/api/http";
import { getAuditRequestContext } from "@/lib/audit/log";
import { requireInternalSession } from "@/lib/auth/session";
import type { UserRole } from "@/lib/domain/core";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { autoConfirmOverdueTasks } from "@/lib/tasks/customer-auto-confirm-service";

const autoConfirmRoles: UserRole[] = ["system_admin", "firm_admin"];

export async function POST(request: Request) {
  try {
    const session = await requireInternalSession(autoConfirmRoles);
    const admin = createSupabaseAdminClient();
    const result = await autoConfirmOverdueTasks(admin, session, getAuditRequestContext(request));

    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
