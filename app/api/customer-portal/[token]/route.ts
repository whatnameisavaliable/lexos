import { ApiError, handleApiError, ok, routeParam } from "@/lib/api/http";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildPortalTokenHash } from "@/lib/workflow/validation";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const token = await routeParam(context, "token");
    const admin = createSupabaseAdminClient();
    const { data: link, error } = await admin
      .from("customer_portal_links")
      .select(
        "id, status, last_verified_at, customers:customer_id(id, name), tasks:task_id(id, title, description, status, submitted_at, approved_at, customer_confirmed_at, task_deliverables(id, title, content, external_url, submitted_at, file_name, file_size_bytes, file_mime_type))",
      )
      .eq("token_hash", buildPortalTokenHash(token))
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!link || link.status !== "active") {
      throw new ApiError(404, "NOT_FOUND", "客户链接不存在或已失效");
    }

    if (!link.last_verified_at) {
      throw new ApiError(401, "UNAUTHORIZED", "请先完成验证码校验");
    }

    return ok({ portal: link });
  } catch (error) {
    return handleApiError(error);
  }
}
