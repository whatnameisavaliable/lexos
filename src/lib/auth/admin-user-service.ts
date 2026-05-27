import { randomUUID } from "node:crypto";

import type { User } from "@supabase/supabase-js";

import { usernameToEmail } from "@/lib/auth/username";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CreatableUserRole, Profile, UserRole } from "@/types/user";

export class AuthServiceError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

async function findAuthUserByEmail(email: string): Promise<User | null> {
  const admin = createAdminClient();
  const normalized = email.toLowerCase();
  let page = 1;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) {
      throw new AuthServiceError(error.message, "auth_lookup_failed");
    }

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === normalized,
    );
    if (match) {
      return match;
    }
    if (data.users.length < 200) {
      break;
    }
    page += 1;
  }

  return null;
}

async function inferRoleFromAudit(userId: string): Promise<UserRole | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("audit_logs")
    .select("diff")
    .eq("action", "user.create")
    .eq("target_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const role = (data?.diff as { role?: string } | null)?.role;
  if (
    role === "lawyer" ||
    role === "client" ||
    role === "channel_partner" ||
    role === "director"
  ) {
    return role;
  }
  return null;
}

async function ensureProfileRow(profile: {
  id: string;
  username: string;
  role: UserRole;
  status: Profile["status"];
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").upsert(
    {
      id: profile.id,
      username: profile.username,
      role: profile.role,
      status: profile.status,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new AuthServiceError(error.message, "profile_upsert_failed");
  }
}

/**
 * Auth users without a profiles row (e.g. after repair deleted auth.users and CASCADE removed profile).
 */
export async function reconcileOrphanedProfiles(): Promise<number> {
  const admin = createAdminClient();
  let page = 1;
  let repaired = 0;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) {
      throw new AuthServiceError(error.message, "auth_list_failed");
    }

    for (const authUser of data.users) {
      const username = authUser.user_metadata?.username;
      if (typeof username !== "string" || username === "admin") {
        continue;
      }

      const { data: existing } = await admin
        .from("profiles")
        .select("id")
        .eq("id", authUser.id)
        .maybeSingle();

      if (existing) {
        continue;
      }

      const role =
        (await inferRoleFromAudit(authUser.id)) ??
        (authUser.user_metadata?.role as UserRole | undefined) ??
        "lawyer";

      await ensureProfileRow({
        id: authUser.id,
        username,
        role,
        status: "active",
      });
      repaired += 1;
    }

    if (data.users.length < 200) {
      break;
    }
    page += 1;
  }

  return repaired;
}

export async function listAllProfiles(): Promise<Profile[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, username, role, status, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new AuthServiceError(error.message, "query_failed");
  }

  return (data ?? []) as Profile[];
}

export async function createAppUser(params: {
  username: string;
  role: CreatableUserRole;
  createdByAdminId: string;
}): Promise<{ userId: string; username: string; resetToken: string }> {
  const admin = createAdminClient();
  const email = usernameToEmail(params.username);

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("username", params.username)
    .maybeSingle();

  if (existingProfile) {
    throw new AuthServiceError("用户名已存在", "username_taken");
  }

  const orphanAuth = await findAuthUserByEmail(email);
  if (orphanAuth) {
    await ensureProfileRow({
      id: orphanAuth.id,
      username: params.username,
      role: params.role,
      status: "active",
    });

    const resetToken = await issuePasswordResetForUser(
      orphanAuth.id,
      params.createdByAdminId,
    );

    return {
      userId: orphanAuth.id,
      username: params.username,
      resetToken,
    };
  }

  const placeholderPassword = randomUUID();

  const { data: authData, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password: placeholderPassword,
      email_confirm: true,
      user_metadata: { username: params.username },
    });

  if (createError) {
    const message = createError.message.toLowerCase();
    if (message.includes("already") || message.includes("registered")) {
      throw new AuthServiceError(
        "该用户名在认证系统中已存在但资料缺失，请刷新用户列表或联系管理员执行资料修复",
        "auth_without_profile",
      );
    }
    throw new AuthServiceError(createError.message, "create_failed");
  }

  const userId = authData.user.id;

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    username: params.username,
    role: params.role,
    status: "active",
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    throw new AuthServiceError(profileError.message, "profile_create_failed");
  }

  const { data: resetToken, error: tokenError } = await admin.rpc(
    "issue_password_reset_token",
    {
      p_user_id: userId,
      p_created_by: params.createdByAdminId,
    },
  );

  if (tokenError || typeof resetToken !== "string") {
    throw new AuthServiceError(
      tokenError?.message ?? "无法生成重置链接",
      "reset_token_failed",
    );
  }

  return {
    userId,
    username: params.username,
    resetToken,
  };
}

export async function setUserPasswordViaAuthAdmin(
  userId: string,
  password: string,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  });
  if (error) {
    throw new AuthServiceError(error.message, "password_update_failed");
  }
}

export async function repairAppUserAuth(profile: Profile): Promise<void> {
  const admin = createAdminClient();
  const email = usernameToEmail(profile.username);
  const tempPassword = randomUUID();

  const { data: existing, error: lookupError } =
    await admin.auth.admin.getUserById(profile.id);

  if (lookupError) {
    throw new AuthServiceError(lookupError.message, "repair_lookup_failed");
  }

  if (existing.user) {
    const { error: updateError } = await admin.auth.admin.updateUserById(
      profile.id,
      {
        email,
        email_confirm: true,
        password: tempPassword,
        user_metadata: { username: profile.username },
      },
    );
    if (updateError) {
      throw new AuthServiceError(updateError.message, "repair_failed");
    }
  } else {
    const { error: createError } = await admin.auth.admin.createUser({
      id: profile.id,
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { username: profile.username },
    });
    if (createError) {
      throw new AuthServiceError(createError.message, "repair_failed");
    }
  }

  await ensureProfileRow({
    id: profile.id,
    username: profile.username,
    role: profile.role,
    status: profile.status,
  });
}

export async function issuePasswordResetForUser(
  userId: string,
  createdByAdminId: string,
): Promise<string> {
  const admin = createAdminClient();
  const { data: resetToken, error } = await admin.rpc(
    "issue_password_reset_token",
    {
      p_user_id: userId,
      p_created_by: createdByAdminId,
    },
  );

  if (error || typeof resetToken !== "string") {
    throw new AuthServiceError(
      error?.message ?? "无法生成重置链接",
      "reset_token_failed",
    );
  }

  return resetToken;
}
