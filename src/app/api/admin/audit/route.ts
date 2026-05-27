import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getCurrentProfile } from "@/lib/auth/session";
import { logStructured } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const admin = await getCurrentProfile();
    if (!admin || admin.role !== "admin" || admin.username !== "admin") {
      return jsonError("forbidden", "无权限", 403);
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id, actor_id, target_id, action, diff, ip_address, user_agent, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      logStructured({
        level: "error",
        message: "audit list failed",
        userId: admin.id,
        meta: { details: error.message },
      });
      return jsonError("query_failed", "查询审计日志失败", 500);
    }

    return jsonSuccess({ logs: data ?? [] });
  } catch (err) {
    logStructured({
      level: "error",
      message: "GET /api/admin/audit error",
      meta: { err: String(err) },
    });
    return jsonError("internal_error", "服务器错误", 500);
  }
}
