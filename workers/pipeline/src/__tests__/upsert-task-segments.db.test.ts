import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import { describe, expect, it } from "vitest";
import {
  loadAppRuntimeEnv,
  loadAuthSeedEnvFromProcess,
  loadEnvFiles,
  resolveRepoRoot,
  resolveVirtualEmail,
} from "@lexos/shared/config";

function canRunUpsertSegmentsDbTest(): boolean {
  try {
    const repoRoot = resolveRepoRoot();
    loadEnvFiles(repoRoot, [".env", ".env.development"]);
    loadAuthSeedEnvFromProcess();
    const env = loadAppRuntimeEnv(repoRoot);
    return (
      env.supabaseUrl.startsWith("http") &&
      !env.supabaseDbUrl.includes("your-password")
    );
  } catch {
    return false;
  }
}

describe("upsert_task_segments (db integration)", () => {
  it.skipIf(!canRunUpsertSegmentsDbTest())(
    "service_role upserts and updates segments for a task",
    async () => {
      const repoRoot = resolveRepoRoot();
      loadEnvFiles(repoRoot, [".env", ".env.development"]);
      const appEnv = loadAppRuntimeEnv(repoRoot);
      const authEnv = loadAuthSeedEnvFromProcess();
      const suffix = Date.now().toString(36);
      const username = `m5b_lawyer_${suffix}`;

      const admin = createClient(
        appEnv.supabaseUrl,
        appEnv.supabaseServiceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } },
      );

      const email = resolveVirtualEmail(username, authEnv.authVirtualEmailDomain);
      const { data: userData, error: userError } =
        await admin.auth.admin.createUser({
          email,
          password: authEnv.authInitialPassword,
          email_confirm: true,
        });
      if (userError || !userData.user) {
        throw new Error(`createUser failed: ${userError?.message}`);
      }

      await admin.from("profiles").insert({
        id: userData.user.id,
        username,
        display_name: username,
        role: "lawyer",
        status: "enabled",
        requires_password_change: false,
        mfa_enabled: false,
      });

      const { data: taskRow, error: taskError } = await admin
        .from("transcription_tasks")
        .insert({
          created_by: userData.user.id,
          title: "M5-B segment upsert",
          status: "preprocessing",
          source_mime: "audio/mpeg",
          source_storage_key: `${userData.user.id}/task/sample.mp3`,
          size_bytes: 4096,
          is_mp4: false,
        })
        .select("id")
        .single();
      if (taskError || !taskRow) {
        throw new Error(`insert task failed: ${taskError?.message}`);
      }

      const taskId = taskRow.id as string;

      try {
        const { data: inserted, error: rpcError } = await admin.rpc(
          "upsert_task_segments",
          {
            p_task_id: taskId,
            p_segments: [
              {
                segment_index: 0,
                start_ms: 0,
                end_ms: 900_000,
                chunk_size_bytes: 1024,
                status: "pending",
              },
              {
                segment_index: 1,
                start_ms: 900_000,
                end_ms: 1_800_000,
                chunk_size_bytes: 2048,
                status: "pending",
              },
            ],
          },
        );
        expect(rpcError).toBeNull();
        expect(inserted).toBe(2);

        const db = new pg.Client({ connectionString: appEnv.supabaseDbUrl });
        await db.connect();
        try {
          const { rows } = await db.query<{
            segment_index: number;
            storage_key: string | null;
            chunk_size_bytes: string;
          }>(
            `SELECT segment_index, storage_key, chunk_size_bytes
             FROM public.transcription_segments
             WHERE task_id = $1::uuid
             ORDER BY segment_index ASC`,
            [taskId],
          );
          expect(rows).toHaveLength(2);
          expect(rows[0]?.storage_key).toBeNull();
          expect(Number(rows[0]?.chunk_size_bytes)).toBe(1024);
        } finally {
          await db.end();
        }

        const { data: updated, error: updateError } = await admin.rpc(
          "upsert_task_segments",
          {
            p_task_id: taskId,
            p_segments: [
              {
                segment_index: 0,
                start_ms: 0,
                end_ms: 900_000,
                asr_text: "hello world",
                status: "done",
              },
            ],
          },
        );
        expect(updateError).toBeNull();
        expect(updated).toBe(1);

        const { data: segments, error: selectError } = await admin
          .from("transcription_segments")
          .select("segment_index, asr_text, status")
          .eq("task_id", taskId)
          .eq("segment_index", 0)
          .single();
        expect(selectError).toBeNull();
        expect(segments?.asr_text).toBe("hello world");
        expect(segments?.status).toBe("done");
      } finally {
        await admin.from("transcription_tasks").delete().eq("id", taskId);
        await admin.auth.admin.deleteUser(userData.user.id);
      }
    },
    120_000,
  );
});
