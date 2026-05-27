import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_USER_ID = "00000000-0000-0000-0000-000000000001";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "111111";
const ADMIN_EMAIL = `${ADMIN_USERNAME}@lexos.internal`;

export async function syncAdminAuthViaApi(): Promise<{
  userId: string;
  email: string;
  created: boolean;
}> {
  const admin = createAdminClient();

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
  } else {
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

  return { userId, email: ADMIN_EMAIL, created };
}
