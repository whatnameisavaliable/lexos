import type { NextRequest } from "next/server";

import {
  AuthServiceError,
  createAppUser,
  listAllProfiles,
  reconcileOrphanedProfiles,
} from "@/lib/auth/admin-user-service";
import { buildResetPasswordUrl } from "@/lib/auth/reset-url";
import { getRequestMeta } from "@/lib/api/request-meta";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getCurrentProfile } from "@/lib/auth/session";
import { logStructured } from "@/lib/logger";
import { parseCreatableRole, parseUsername } from "@/lib/validation/user";
import type { Profile } from "@/types/user";

async function requireAdminProfile() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin" || profile.username !== "admin") {
    return null;
  }
  return profile;
}

export async function GET() {
  try {
    const admin = await requireAdminProfile();
    if (!admin) {
      return jsonError("forbidden", "无权限", 403);
    }

    let users: Profile[];
    try {
      await reconcileOrphanedProfiles();
      users = await listAllProfiles();
    } catch (err) {
      if (err instanceof AuthServiceError) {
        return jsonError(err.code, err.message, 500);
      }
      throw err;
    }

    logStructured({
      level: "info",
      message: "list users",
      userId: admin.id,
      meta: { count: users.length },
    });

    return jsonSuccess({ users });
  } catch (err) {
    logStructured({
      level: "error",
      message: "GET /api/admin/users error",
      meta: { err: String(err) },
    });
    return jsonError("internal_error", "服务器错误", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminProfile();
    if (!admin) {
      return jsonError("forbidden", "无权限", 403);
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return jsonError("invalid_body", "请求体无效", 400);
    }

    const record = body as Record<string, unknown>;
    const username = parseUsername(record.username);
    const role = parseCreatableRole(record.role);

    if (!username) {
      return jsonError("invalid_username", "用户名仅允许字母和数字", 400);
    }
    if (!role) {
      return jsonError("invalid_role", "角色无效", 400);
    }

    const result = await createAppUser({
      username,
      role,
      createdByAdminId: admin.id,
    });

    return jsonSuccess({
      userId: result.userId,
      username: result.username,
      resetUrl: buildResetPasswordUrl(result.resetToken),
    });
  } catch (err) {
    if (err instanceof AuthServiceError) {
      return jsonError(err.code, err.message, 400);
    }
    logStructured({
      level: "error",
      message: "POST /api/admin/users error",
      meta: { err: String(err) },
    });
    return jsonError("internal_error", "服务器错误", 500);
  }
}
