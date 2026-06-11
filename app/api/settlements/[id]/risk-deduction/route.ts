import { handleApiError, ok, readJsonObject, routeParam } from "@/lib/api/http";
import { getAuditRequestContext } from "@/lib/audit/log";
import { requireInternalSession } from "@/lib/auth/session";
import { lockSettlementRiskDeduction } from "@/lib/settlements/risk-deduction-service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireInternalSession(["system_admin", "firm_admin", "finance"]);
    const settlementId = await routeParam(context, "id");
    const body = await readJsonObject(request);
    const admin = createSupabaseAdminClient();
    const result = await lockSettlementRiskDeduction(
      admin,
      session,
      settlementId,
      body,
      getAuditRequestContext(request),
    );

    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
