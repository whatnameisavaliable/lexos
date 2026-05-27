/**
 * Sync built-in admin password via Supabase Auth Admin API (GoTrue-compatible hash).
 *
 * Usage (from project root):
 *   node --env-file=.env.local scripts/sync-admin-password.mjs
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (server-only, not exposed to browser).
 */

import { createClient } from "@supabase/supabase-js";

const ADMIN_USER_ID = "00000000-0000-0000-0000-000000000001";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "111111";
const ADMIN_EMAIL = `${ADMIN_USERNAME}@lexos.internal`;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env ${name} (check .env.local)`);
  }
  return value;
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Target admin email: ${ADMIN_EMAIL}`);

  let userId = ADMIN_USER_ID;
  let created = false;

  const { data: updated, error: updateError } =
    await admin.auth.admin.updateUserById(ADMIN_USER_ID, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { username: ADMIN_USERNAME },
    });

  if (!updateError && updated?.user) {
    userId = updated.user.id;
    console.log("Updated admin via Auth Admin API (by fixed user id).");
  } else {
    console.warn(
      "Update by id failed, trying createUser:",
      updateError?.message ?? "unknown",
    );

    const { data: createdUser, error: createError } =
      await admin.auth.admin.createUser({
        id: ADMIN_USER_ID,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { username: ADMIN_USERNAME },
      });

    if (createError) {
      throw createError;
    }

    userId = createdUser.user.id;
    created = true;
    console.log("Created admin user via Auth Admin API.");
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      username: ADMIN_USERNAME,
      role: "admin",
      status: "active",
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw profileError;
  }

  console.log("Profile upserted (admin / active).");
  console.log("Done. Login with username admin and password 111111");
}

main().catch((err) => {
  console.error(err);
  console.error(`
If you see "Database error loading/checking user/email":
1) Run migration:  supabase db push   (includes 20260527140000_reset_admin_for_auth_api.sql)
   OR execute:     supabase/scripts/reset-admin-for-api.sql  in SQL Editor
2) Run again:      npm run setup:admin
`);
  process.exit(1);
});
