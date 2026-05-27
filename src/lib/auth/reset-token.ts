import { createHash } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

/** Must match PostgreSQL `public.hash_reset_token` (SHA-256 hex). */
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export interface ResolvedResetToken {
  tokenRowId: string;
  userId: string;
  username: string;
}

export async function resolveResetToken(
  rawToken: string,
): Promise<ResolvedResetToken | null> {
  const token = rawToken.trim();
  if (!token) {
    return null;
  }

  const admin = createAdminClient();
  const tokenHash = hashResetToken(token);

  const { data: row, error } = await admin
    .from("password_reset_tokens")
    .select("id, user_id, expires_at, consumed_at")
    .eq("token_hash", tokenHash)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !row) {
    return null;
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("username")
    .eq("id", row.user_id)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  return {
    tokenRowId: row.id,
    userId: row.user_id,
    username: profile.username,
  };
}

export async function consumeResetToken(
  tokenRowId: string,
  userId: string,
  username: string,
  meta?: { ip: string | null; userAgent: string | null },
): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { error: consumeError } = await admin
    .from("password_reset_tokens")
    .update({ consumed_at: now })
    .eq("id", tokenRowId)
    .is("consumed_at", null);

  if (consumeError) {
    throw consumeError;
  }

  const { error: auditError } = await admin.from("audit_logs").insert({
    actor_id: userId,
    target_id: userId,
    action: "user.password_reset_complete",
    diff: { username },
    ip_address: meta?.ip ?? null,
    user_agent: meta?.userAgent ?? null,
  });

  if (auditError) {
    throw auditError;
  }
}
