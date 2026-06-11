import { ApiError, handleApiError, ok, readJsonObject, stringField } from "@/lib/api/http";
import { getAuditRequestContext, writeAuditLog } from "@/lib/audit/log";
import { DEFAULT_INITIAL_PASSWORD } from "@/lib/domain/core";
import { requireInternalSession } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const newPassword = stringField(body, "newPassword", "新密码");

    if (newPassword.length < 6) {
      throw new ApiError(400, "BAD_REQUEST", "新密码至少 6 位");
    }

    if (newPassword === DEFAULT_INITIAL_PASSWORD) {
      throw new ApiError(400, "BAD_REQUEST", "新密码不能继续使用默认密码 111111");
    }

    const session = await requireInternalSession();
    const serverClient = await createSupabaseServerClient();

    if (!serverClient) {
      throw new ApiError(503, "CONFIG_MISSING", "Supabase 服务端客户端不可用");
    }

    const { error: updateAuthError } = await serverClient.auth.updateUser({ password: newPassword });

    if (updateAuthError) {
      throw updateAuthError;
    }

    const admin = createSupabaseAdminClient();
    const { error: profileError } = await admin
      .from("profiles")
      .update({ must_change_password: false })
      .eq("id", session.userId);

    if (profileError) {
      throw profileError;
    }

    await writeAuditLog(admin, {
      organizationId: session.organizationId,
      actorUserId: session.userId,
      action: "auth.change_password",
      entityType: "auth",
      entityId: session.userId,
      metadata: { username: session.username },
      ...getAuditRequestContext(request),
    });

    return ok({ mustChangePassword: false });
  } catch (error) {
    return handleApiError(error);
  }
}
