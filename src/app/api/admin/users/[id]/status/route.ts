import type { NextRequest } from "next/server";

import { getRequestMeta } from "@/lib/api/request-meta";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getCurrentProfile } from "@/lib/auth/session";
import { logStructured } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { parseUserStatus } from "@/lib/validation/user";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await getCurrentProfile();
    if (!admin || admin.role !== "admin") {
      return jsonError("forbidden", "无权限", 403);
    }

    const { id } = await context.params;
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return jsonError("invalid_body", "请求体无效", 400);
    }

    const status = parseUserStatus((body as Record<string, unknown>).status);
    if (!status) {
      return jsonError("invalid_status", "状态无效", 400);
    }

    const { ip, userAgent } = getRequestMeta(request);
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("admin_update_user_status", {
      p_user_id: id,
      p_status: status,
      p_ip: ip,
      p_user_agent: userAgent,
    });

    if (error) {
      return jsonError("update_failed", error.message, 400);
    }

    return jsonSuccess(data);
  } catch (err) {
    logStructured({
      level: "error",
      message: "PATCH user status error",
      meta: { err: String(err) },
    });
    return jsonError("internal_error", "服务器错误", 500);
  }
}
