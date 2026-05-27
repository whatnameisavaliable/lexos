import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv, getSupabaseServiceRoleKey } from "@/lib/env";

/**
 * Service-role client — bypasses RLS. Use only in trusted server jobs
 * (cron, webhooks). Never import from Client Components or expose to the browser.
 */
export function createAdminClient() {
  const { url } = getSupabasePublicEnv();
  return createClient(url, getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
