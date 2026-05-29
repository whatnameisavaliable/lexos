import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { BUILTIN_ADMIN_USERNAME, loadSupabaseEnv, resolveRepoRoot } from "../config/index.js";
import { assertBuiltinAdminProfileExists } from "./builtin-admin.js";

describe("M0-C builtin admin verification (integration)", () => {
  it("remote profiles has unique enabled admin with requires_password_change", async () => {
    const repoRoot = resolveRepoRoot();
    const env = loadSupabaseEnv(repoRoot);
    const client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const profile = await assertBuiltinAdminProfileExists(client);
    expect(profile.username).toBe(BUILTIN_ADMIN_USERNAME);
    expect(profile.requiresPasswordChange).toBe(true);

    const { data: duplicates, error } = await client
      .from("profiles")
      .select("id")
      .eq("username", BUILTIN_ADMIN_USERNAME);

    expect(error).toBeNull();
    expect(duplicates?.length).toBe(1);
  });
});
