import { normalizeSupabaseUrl } from "./supabase/url.ts";

export type SupabaseRuntimeEnv = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  defaultOrganizationId: string;
  authEmailDomain: string;
};

export const DEFAULT_ORGANIZATION_ID = "00000000-0000-0000-0000-000000000001";

export function getSupabaseRuntimeEnv(): SupabaseRuntimeEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    return null;
  }

  return {
    url: normalizeSupabaseUrl(url),
    anonKey,
    serviceRoleKey,
    defaultOrganizationId: process.env.LEXOS_DEFAULT_ORGANIZATION_ID ?? DEFAULT_ORGANIZATION_ID,
    authEmailDomain: process.env.LEXOS_AUTH_EMAIL_DOMAIN ?? "lexos.local",
  };
}

export function getMissingSupabaseEnvKeys(): string[] {
  const keys: Array<[string, string | undefined]> = [
    ["NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY],
    ["SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY],
  ];

  return keys.filter(([, value]) => !value).map(([key]) => key);
}
