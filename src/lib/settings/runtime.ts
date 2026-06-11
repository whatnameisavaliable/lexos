import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeSystemSettingValue, type SystemSettingValue } from "./definitions.ts";

export type ConfiguredSystemSetting<T extends SystemSettingValue> = {
  configured: boolean;
  value: T;
};

export async function loadSystemSettingNumber(
  admin: SupabaseClient,
  organizationId: string,
  key: string,
): Promise<number> {
  const value = await loadSystemSettingValue(admin, organizationId, key);

  if (typeof value !== "number") {
    throw new Error(`${key} 必须是数字参数`);
  }

  return value;
}

export async function loadSystemSettingString(
  admin: SupabaseClient,
  organizationId: string,
  key: string,
): Promise<string> {
  const value = await loadSystemSettingValue(admin, organizationId, key);

  if (typeof value !== "string") {
    throw new Error(`${key} 必须是字符串参数`);
  }

  return value;
}

export async function loadConfiguredSystemSettingNumber(
  admin: SupabaseClient,
  organizationId: string,
  key: string,
): Promise<ConfiguredSystemSetting<number>> {
  const setting = await loadConfiguredSystemSettingValue(admin, organizationId, key);

  if (typeof setting.value !== "number") {
    throw new Error(`${key} 必须是数字参数`);
  }

  return {
    configured: setting.configured,
    value: setting.value,
  };
}

export function settlementLockUntil(generatedAt: string | null | undefined, lockDays: number): Date | null {
  if (!generatedAt || lockDays <= 0) {
    return null;
  }

  const generatedDate = new Date(generatedAt);

  if (Number.isNaN(generatedDate.getTime())) {
    return null;
  }

  return new Date(generatedDate.getTime() + lockDays * 24 * 60 * 60 * 1000);
}

export function isSettlementConfirmationLocked(
  generatedAt: string | null | undefined,
  lockDays: number,
  now = new Date(),
): boolean {
  const lockedUntil = settlementLockUntil(generatedAt, lockDays);

  return lockedUntil ? lockedUntil.getTime() > now.getTime() : false;
}

export type SettlementRiskLockStatus = {
  daysRemaining: number;
  locked: boolean;
  lockedUntil: Date | null;
};

export function buildSettlementRiskLockStatus(
  generatedAt: string | null | undefined,
  lockDays: number,
  now = new Date(),
): SettlementRiskLockStatus {
  const lockedUntil = settlementLockUntil(generatedAt, lockDays);
  const remainingMs = lockedUntil ? lockedUntil.getTime() - now.getTime() : 0;
  const locked = remainingMs > 0;

  return {
    daysRemaining: locked ? Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000))) : 0,
    locked,
    lockedUntil,
  };
}

async function loadSystemSettingValue(admin: SupabaseClient, organizationId: string, key: string): Promise<SystemSettingValue> {
  const setting = await loadConfiguredSystemSettingValue(admin, organizationId, key);

  return setting.value;
}

async function loadConfiguredSystemSettingValue(
  admin: SupabaseClient,
  organizationId: string,
  key: string,
): Promise<ConfiguredSystemSetting<SystemSettingValue>> {
  const { data, error } = await admin
    .from("system_settings")
    .select("value")
    .eq("organization_id", organizationId)
    .eq("key", key)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    configured: Boolean(data),
    value: normalizeSystemSettingValue(key, data?.value),
  };
}
