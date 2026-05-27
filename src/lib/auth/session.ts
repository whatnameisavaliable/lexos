import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/user";

export async function getSessionUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return data.user.id;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, role, status, created_at, updated_at")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Profile;
}

export function isProfileLoginAllowed(profile: Profile): boolean {
  return profile.status === "active";
}
