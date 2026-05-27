import { jsonError, jsonSuccess } from "@/lib/api/response";
import { logStructured } from "@/lib/logger";
import { syncAdminAuthViaApi } from "@/lib/setup/sync-admin-auth";

/**
 * Dev/setup only: reset admin password using Auth Admin API (service role).
 * Not for production exposure.
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return jsonError("forbidden", "Not available in production", 403);
  }

  try {
    const result = await syncAdminAuthViaApi();
    logStructured({
      level: "info",
      message: "sync-admin completed",
      meta: { userId: result.userId, created: result.created },
    });
    return jsonSuccess({
      message: "Admin password synced. Login with admin / 111111",
      ...result,
    });
  } catch (err) {
    logStructured({
      level: "error",
      message: "sync-admin failed",
      meta: { err: String(err) },
    });
    return jsonError(
      "sync_failed",
      err instanceof Error ? err.message : "Sync failed",
      500,
    );
  }
}
