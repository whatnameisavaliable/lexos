import type { NextRequest } from "next/server";

import {
  AuthServiceError,
  issuePasswordResetForUser,
} from "@/lib/auth/admin-user-service";
import { buildResetPasswordUrl } from "@/lib/auth/reset-url";
import { getRequestMeta } from "@/lib/api/request-meta";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getCurrentProfile } from "@/lib/auth/session";
import { logStructured } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const admin = await getCurrentProfile();
    if (!admin || admin.role !== "admin") {
      return jsonError("forbidden", "无权限", 403);
    }

    const { id } = await context.params;
    const { ip, userAgent } = getRequestMeta(request);
    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", id)
      .maybeSingle();

    if (profileError || !profile) {
      return jsonError("user_not_found", "用户不存在", 404);
    }

    if (profile.username === "admin") {
      return jsonError("cannot_reset_admin", "无法重置内置管理员", 400);
    }

    const resetToken = await issuePasswordResetForUser(id, admin.id);

    const serviceAdmin = createAdminClient();
    await serviceAdmin.from("audit_logs").insert({
      actor_id: admin.id,
      target_id: id,
      action: "user.password_reset_issue",
      diff: { username: profile.username },
      ip_address: ip,
      user_agent: userAgent,
    });

    return jsonSuccess({
      resetUrl: buildResetPasswordUrl(resetToken),
      username: profile.username,
    });
  } catch (err) {
    if (err instanceof AuthServiceError) {
      return jsonError(err.code, err.message, 400);
    }
    logStructured({
      level: "error",
      message: "POST user reset error",
      meta: { err: String(err) },
    });
    return jsonError("internal_error", "服务器错误", 500);
  }
}
