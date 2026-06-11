import { ApiError, handleApiError, ok, readJsonObject, routeParam, stringField } from "@/lib/api/http";
import { verifyDemoPortalCode } from "@/lib/domain/portal";
import { loadSystemSettingString } from "@/lib/settings/runtime";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildPortalTokenHash } from "@/lib/workflow/validation";

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const token = await routeParam(context, "token");
    const body = await readJsonObject(request);
    const phone = stringField(body, "phone", "手机号");
    const code = stringField(body, "code", "验证码");
    const admin = createSupabaseAdminClient();
    const { data: link, error } = await admin
      .from("customer_portal_links")
      .select("id, organization_id, phone, status")
      .eq("token_hash", buildPortalTokenHash(token))
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!link) {
      throw new ApiError(404, "NOT_FOUND", "客户链接不存在");
    }

    const expectedCode = await loadSystemSettingString(admin, link.organization_id, "customer_portal_demo_code");
    const result = verifyDemoPortalCode({
      expectedCode,
      expectedPhone: link.phone,
      submittedPhone: phone,
      submittedCode: code,
      linkStatus: link.status,
    });

    if (!result.verified) {
      throw new ApiError(401, "UNAUTHORIZED", "手机号或验证码不正确");
    }

    await admin.from("customer_portal_links").update({ last_verified_at: new Date().toISOString() }).eq("id", link.id);

    return ok({ verified: true });
  } catch (error) {
    return handleApiError(error);
  }
}
