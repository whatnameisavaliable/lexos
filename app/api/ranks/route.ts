import { handleApiError, ok } from "@/lib/api/http";
import { requireInternalSession } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const session = await requireInternalSession();
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("ranks")
      .select("id, code, name, settlement_basis_points, sort_order, is_active")
      .eq("organization_id", session.organizationId)
      .order("sort_order", { ascending: true });

    if (error) {
      throw error;
    }

    return ok({ ranks: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

