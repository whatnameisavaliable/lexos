import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveVirtualEmail } from "../config/auth-env.js";

/** RLS 测试用律师夹具。 */
export interface LawyerRlsFixture {
  readonly userId: string;
  readonly username: string;
  readonly virtualEmail: string;
  readonly taskId: string;
}

export interface CreateLawyerRlsFixtureParams {
  readonly username: string;
  readonly password: string;
  readonly virtualEmailDomain: string;
  readonly title: string;
}

/**
 * 使用 service_role 创建律师 Auth 用户、`profiles` 行与一条 `transcription_tasks`。
 */
export async function createLawyerRlsFixture(
  adminClient: SupabaseClient,
  params: CreateLawyerRlsFixtureParams,
): Promise<LawyerRlsFixture> {
  const virtualEmail = resolveVirtualEmail(
    params.username,
    params.virtualEmailDomain,
  );

  const existingId = await findUserIdByEmail(adminClient, virtualEmail);
  let userId = existingId;

  if (!userId) {
    const { data, error } = await adminClient.auth.admin.createUser({
      email: virtualEmail,
      password: params.password,
      email_confirm: true,
      user_metadata: { username: params.username },
    });
    if (error) {
      throw new Error(`createUser failed: ${error.message}`);
    }
    userId = data.user.id;
  }

  const { error: profileError } = await adminClient.from("profiles").upsert(
    {
      id: userId,
      username: params.username,
      display_name: `RLS Test ${params.username}`,
      role: "lawyer",
      status: "enabled",
      requires_password_change: false,
      mfa_enabled: false,
    },
    { onConflict: "id" },
  );
  if (profileError) {
    throw new Error(`profiles upsert failed: ${profileError.message}`);
  }

  const { data: task, error: taskError } = await adminClient
    .from("transcription_tasks")
    .insert({
      created_by: userId,
      title: params.title,
      status: "uploading",
      source_mime: "audio/mpeg",
      source_storage_key: `${userId}/rls-fixture/source.mp3`,
      size_bytes: 1024,
    })
    .select("id")
    .single();

  if (taskError || !task) {
    throw new Error(`transcription_tasks insert failed: ${taskError?.message}`);
  }

  return {
    userId,
    username: params.username,
    virtualEmail,
    taskId: task.id,
  };
}

/**
 * 使用律师 JWT 客户端查询指定任务 ID（RLS 生效）。
 */
export async function fetchTranscriptionTaskAsUser(
  userClient: SupabaseClient,
  taskId: string,
): Promise<{ readonly id: string } | null> {
  const { data, error } = await userClient
    .from("transcription_tasks")
    .select("id")
    .eq("id", taskId)
    .maybeSingle();

  if (error) {
    throw new Error(`transcription_tasks select failed: ${error.message}`);
  }

  return data;
}

/**
 * 律师用户登录并返回携带会话的 Supabase 客户端（仅 Auth + RLS 读）。
 */
export async function signInLawyerClient(
  supabaseUrl: string,
  anonKey: string,
  virtualEmail: string,
  password: string,
): Promise<SupabaseClient> {
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await client.auth.signInWithPassword({
    email: virtualEmail,
    password,
  });

  if (error || !data.session) {
    throw new Error(`signInWithPassword failed: ${error?.message}`);
  }

  return createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function findUserIdByEmail(
  adminClient: SupabaseClient,
  email: string,
): Promise<string | null> {
  const { data, error } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) {
    throw new Error(`listUsers failed: ${error.message}`);
  }
  return (
    data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
      ?.id ?? null
  );
}
