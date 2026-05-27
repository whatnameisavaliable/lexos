import type { NextRequest } from "next/server";

import {
  AuthServiceError,
  setUserPasswordViaAuthAdmin,
} from "@/lib/auth/admin-user-service";
import { consumeResetToken, resolveResetToken } from "@/lib/auth/reset-token";
import { getRequestMeta } from "@/lib/api/request-meta";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { logStructured } from "@/lib/logger";
import { parsePassword } from "@/lib/validation/user";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return jsonError("invalid_body", "请求体无效", 400);
    }

    const record = body as Record<string, unknown>;
    const token = typeof record.token === "string" ? record.token : null;
    const password = parsePassword(record.password);

    if (!token?.trim()) {
      return jsonError("invalid_token", "缺少重置令牌", 400);
    }
    if (!password) {
      return jsonError("password_too_short", "密码至少 8 位", 400);
    }

    const resolved = await resolveResetToken(token);
    if (!resolved) {
      logStructured({
        level: "warn",
        message: "reset token not found or expired",
        meta: { tokenLength: token.trim().length },
      });
      return jsonError("invalid_or_expired_token", "链接无效或已过期", 400);
    }

    try {
      await setUserPasswordViaAuthAdmin(resolved.userId, password);
    } catch (err) {
      if (err instanceof AuthServiceError) {
        logStructured({
          level: "error",
          message: "auth admin password update failed",
          meta: { details: err.message, userId: resolved.userId },
        });
        return jsonError(err.code, "密码设置失败，请联系管理员", 500);
      }
      throw err;
    }

    const { ip, userAgent } = getRequestMeta(request);
    try {
      await consumeResetToken(resolved.tokenRowId, resolved.userId, resolved.username, {
        ip,
        userAgent,
      });
    } catch (consumeErr) {
      logStructured({
        level: "warn",
        message: "token consume after password set failed",
        meta: { err: String(consumeErr), userId: resolved.userId },
      });
    }

    return jsonSuccess({ username: resolved.username });
  } catch (err) {
    logStructured({
      level: "error",
      message: "reset-password route error",
      meta: { err: String(err) },
    });
    return jsonError("internal_error", "服务器错误", 500);
  }
}
