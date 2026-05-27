import type { NextRequest } from "next/server";

import {
  AuthServiceError,
  issuePasswordResetForUser,
  repairAppUserAuth,
} from "@/lib/auth/admin-user-service";
import { buildResetPasswordUrl } from "@/lib/auth/reset-url";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getCurrentProfile } from "@/lib/auth/session";
import { logStructured } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/user";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await getCurrentProfile();
    if (!admin || admin.role !== "admin") {
      return jsonError("forbidden", "无权限", 403);
    }

    const { id } = await context.params;
    const supabase = createAdminClient();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, username, role, status")
      .eq("id", id)
      .maybeSingle();

    if (error || !profile) {
      return jsonError("user_not_found", "用户不存在", 404);
    }

    const typedProfile = profile as Profile;
    if (typedProfile.username === "admin") {
      return jsonError("cannot_repair_admin", "无法修复内置管理员", 400);
    }

    await repairAppUserAuth(typedProfile);
    const resetToken = await issuePasswordResetForUser(
      typedProfile.id,
      admin.id,
    );

    return jsonSuccess({
      username: typedProfile.username,
      resetUrl: buildResetPasswordUrl(resetToken),
      message: "账号已修复，请将新的一次性重置链接发给用户",
    });
  } catch (err) {
    if (err instanceof AuthServiceError) {
      return jsonError(err.code, err.message, 400);
    }
    logStructured({
      level: "error",
      message: "repair user auth failed",
      meta: { err: String(err) },
    });
    return jsonError("internal_error", "修复失败", 500);
  }
}
