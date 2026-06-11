import { handleApiError, ok, routeParam } from "@/lib/api/http";
import { getAuditRequestContext } from "@/lib/audit/log";
import { requireInternalSession } from "@/lib/auth/session";
import { confirmSettlements } from "@/lib/settlements/confirm";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireInternalSession(["finance"]);
    const settlementId = await routeParam(context, "id");
    const admin = createSupabaseAdminClient();
    const result = await confirmSettlements(admin, session, [settlementId], getAuditRequestContext(request));

    return ok({ settlement: result.settlements[0] });
  } catch (error) {
    return handleApiError(error);
  }
}
