import { handleApiError, ok, readJsonObject } from "@/lib/api/http";
import { getAuditRequestContext } from "@/lib/audit/log";
import { requireInternalSession } from "@/lib/auth/session";
import { confirmSettlements, normalizeSettlementIdList } from "@/lib/settlements/confirm";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const session = await requireInternalSession(["finance"]);
    const body = await readJsonObject(request);
    const settlementIds = normalizeSettlementIdList(body.settlementIds ?? body.ids);
    const admin = createSupabaseAdminClient();
    const result = await confirmSettlements(admin, session, settlementIds, getAuditRequestContext(request));

    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
