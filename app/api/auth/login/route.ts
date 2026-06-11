import { ApiError, handleApiError, ok, readJsonObject, stringField } from "@/lib/api/http";
import { getAuditRequestContext, writeAuditLog } from "@/lib/audit/log";
import { loadInternalSessionForUser } from "@/lib/auth/session";
import { normalizeUsername } from "@/lib/auth/user-provisioning";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LoginFailureReason = "inactive_profile" | "invalid_credentials";
type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const username = normalizeUsername(stringField(body, "username", "用户名"));
    const password = stringField(body, "password", "密码");
    const admin = createSupabaseAdminClient();
    const serverClient = await createSupabaseServerClient();

    if (!serverClient) {
      throw new ApiError(503, "CONFIG_MISSING", "Supabase 服务端客户端不可用");
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, username, display_name, auth_email, status, must_change_password")
      .eq("username", username)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!profile) {
      throw new ApiError(401, "UNAUTHORIZED", "用户名或密码不正确");
    }

    if (profile.status !== "active") {
      await writeLoginFailureAudit(admin, request, profile.id, profile.username, "inactive_profile");
      throw new ApiError(401, "UNAUTHORIZED", "用户名或密码不正确");
    }

    const { error: signInError } = await serverClient.auth.signInWithPassword({
      email: profile.auth_email,
      password,
    });

    if (signInError) {
      await writeLoginFailureAudit(admin, request, profile.id, profile.username, "invalid_credentials");
      throw new ApiError(401, "UNAUTHORIZED", "用户名或密码不正确");
    }

    const session = await loadInternalSessionForUser(profile.id);
    await writeAuditLog(admin, {
      organizationId: session.organizationId,
      actorUserId: session.userId,
      action: "auth.login",
      entityType: "auth",
      entityId: session.userId,
      metadata: { username: session.username },
      ...getAuditRequestContext(request),
    });

    return ok({
      user: {
        id: session.userId,
        username: session.username,
        displayName: session.displayName,
        role: session.roleCode,
        rankCode: session.rankCode,
        mustChangePassword: session.mustChangePassword,
        status: "active",
      },
      mustChangePassword: session.mustChangePassword,
      defaultRoute: "/",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

async function writeLoginFailureAudit(
  admin: SupabaseAdminClient,
  request: Request,
  profileId: string,
  username: string,
  reason: LoginFailureReason,
): Promise<void> {
  try {
    const { data: member, error } = await admin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", profileId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!member?.organization_id) {
      return;
    }

    await writeAuditLog(admin, {
      organizationId: member.organization_id,
      actorUserId: profileId,
      action: "auth.login_failed",
      entityType: "auth",
      entityId: profileId,
      metadata: { reason, username },
      ...getAuditRequestContext(request),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    console.warn("[audit] login failure write failed", message);
  }
}
