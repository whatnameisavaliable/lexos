import { ApiError, handleApiError, ok, readJsonObject } from "@/lib/api/http";
import { getAuditRequestContext, writeAuditLog } from "@/lib/audit/log";
import { requireInternalSession } from "@/lib/auth/session";
import {
  SYSTEM_SETTING_DEFINITIONS,
  buildSystemSettingsFromRows,
  normalizeSystemSettingValue,
} from "@/lib/settings/definitions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const settingsRoles = ["system_admin", "firm_admin"] as const;

export async function GET() {
  try {
    const session = await requireInternalSession([...settingsRoles]);
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("system_settings")
      .select("key, value, updated_at")
      .eq("organization_id", session.organizationId)
      .in(
        "key",
        SYSTEM_SETTING_DEFINITIONS.map((setting) => setting.key),
      );

    if (error) {
      throw error;
    }

    return ok({ settings: buildSystemSettingsFromRows(data ?? []) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireInternalSession([...settingsRoles]);
    const body = await readJsonObject(request);

    if (!Array.isArray(body.settings)) {
      throw new ApiError(400, "BAD_REQUEST", "settings 必须是数组");
    }

    const updates = body.settings.map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new ApiError(400, "BAD_REQUEST", "系统参数更新项必须是对象");
      }

      const record = item as Record<string, unknown>;

      if (typeof record.key !== "string") {
        throw new ApiError(400, "BAD_REQUEST", "系统参数 key 必须是字符串");
      }

      try {
        return {
          key: record.key,
          value: normalizeSystemSettingValue(record.key, record.value),
        };
      } catch (error) {
        throw new ApiError(400, "BAD_REQUEST", error instanceof Error ? error.message : "系统参数不合法");
      }
    });

    const admin = createSupabaseAdminClient();
    const rows = updates.map((setting) => ({
      description: SYSTEM_SETTING_DEFINITIONS.find((definition) => definition.key === setting.key)?.description,
      key: setting.key,
      organization_id: session.organizationId,
      updated_at: new Date().toISOString(),
      updated_by: session.userId,
      value: setting.value,
    }));

    const { error } = await admin.from("system_settings").upsert(rows, { onConflict: "organization_id,key" });

    if (error) {
      throw error;
    }

    await writeAuditLog(admin, {
      organizationId: session.organizationId,
      actorUserId: session.userId,
      action: "system_settings.update",
      entityType: "system_settings",
      metadata: {
        keys: updates.map((setting) => setting.key),
      },
      ...getAuditRequestContext(request),
    });

    const { data: nextRows, error: nextError } = await admin
      .from("system_settings")
      .select("key, value, updated_at")
      .eq("organization_id", session.organizationId)
      .in(
        "key",
        SYSTEM_SETTING_DEFINITIONS.map((setting) => setting.key),
      );

    if (nextError) {
      throw nextError;
    }

    return ok({ settings: buildSystemSettingsFromRows(nextRows ?? []) });
  } catch (error) {
    return handleApiError(error);
  }
}
