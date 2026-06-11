import { createBrowserClient } from "@supabase/ssr";

import { normalizeSupabaseUrl } from "@/lib/supabase/url";

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createBrowserClient(normalizeSupabaseUrl(supabaseUrl), supabaseAnonKey);
}
