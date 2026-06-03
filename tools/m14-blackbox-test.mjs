/**
 * M14 SOP Worker blackbox runner — API + Storage + U3 Worker poll + DB assertions.
 * Usage: npx tsx tools/m14-blackbox-test.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
config({ path: resolve(repoRoot, ".env.development") });

const BASE = process.env.API_URL ?? "http://localhost:4000";
const PASS = process.env.AUTH_INITIAL_PASSWORD ?? "111111";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MEDIA_BUCKET = process.env.STORAGE_BUCKET_MEDIA ?? "media";
const EXPORTS_BUCKET = process.env.STORAGE_BUCKET_EXPORTS ?? "exports";
const DB_URL = process.env.WORKER_DB_URL ?? process.env.SUPABASE_DB_URL;

const results = [];

function record(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(`[${pass ? "PASS" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function api(method, path, { token, body, headers: extraHeaders } = {}) {
  const headers = { "Content-Type": "application/json", ...extraHeaders };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* ignore */
  }
  return { status: res.status, json, text };
}

async function login(username) {
  const r = await api("POST", "/api/auth/login", {
    body: { username, password: PASS },
  });
  return {
    token: r.json?.data?.accessToken ?? null,
    userId: r.json?.data?.userId ?? null,
  };
}

async function withDb(fn) {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function queryDb(sql, params = []) {
  return withDb(async (client) => {
    const { rows } = await client.query(sql, params);
    return rows;
  });
}

async function execDb(sql, params = []) {
  return withDb(async (client) => {
    await client.query(sql, params);
  });
}

async function cleanupOrphanOutbox() {
  const rows = await queryDb(
    `UPDATE public.outbox_events oe
     SET published_at = now()
     FROM (
       SELECT oe2.id
       FROM public.outbox_events oe2
       LEFT JOIN public.transcription_tasks tt
         ON tt.id = (oe2.payload->>'taskId')::uuid
       WHERE oe2.published_at IS NULL
         AND oe2.payload ? 'taskId'
         AND tt.id IS NULL
     ) orphan
     WHERE oe.id = orphan.id
     RETURNING oe.id`,
  );
  if (rows.length > 0) {
    console.log(`[cleanup] marked ${rows.length} orphan transcription outbox row(s) published`);
  }
}

async function createWorkerPoller() {
  const { loadLexosRuntimeEnvFiles, loadWorkerRuntimeEnvFromProcess } =
    await import("@lexos/shared/config");
  loadLexosRuntimeEnvFiles(repoRoot);
  const workerEnv = loadWorkerRuntimeEnvFromProcess();
  const { createWorkerDbPool } = await import(
    "../workers/pipeline/src/infra/worker-db-pool.js"
  );
  const { OutboxPollerService } = await import(
    "../workers/pipeline/src/services/outbox-poller.service.js"
  );
  const { createPipelineStageProcessor } = await import(
    "../workers/pipeline/src/bootstrap/create-pipeline-deps.js"
  );
  const dbPool = createWorkerDbPool(workerEnv);
  const processor = createPipelineStageProcessor(workerEnv);
  const poller = new OutboxPollerService(
    workerEnv,
    dbPool.getPool(),
    processor,
  );
  return { poller, dbPool };
}

async function pollWorkerUntil(label, predicate, { maxAttempts = 90, intervalMs = 2000 } = {}) {
  const { poller, dbPool } = await createWorkerPoller();
  try {
    for (let i = 0; i < maxAttempts; i++) {
      await poller.pollOnce();
      if (await predicate()) {
        console.log(`[poll] ${label} satisfied after ${i + 1} cycle(s)`);
        return true;
      }
      await sleep(intervalMs);
    }
    console.log(`[poll] ${label} timed out after ${maxAttempts} cycles`);
    return false;
  } finally {
    await dbPool.end();
  }
}

async function waitOutboxPublished(pipelineId, stage) {
  return pollWorkerUntil(
    `outbox ${stage} published`,
    async () => {
      const rows = await queryDb(
        `SELECT published_at IS NOT NULL AS ok
         FROM public.outbox_events
         WHERE aggregate_id = $1::uuid
           AND payload->>'stage' = $2
         ORDER BY created_at DESC
         LIMIT 1`,
        [pipelineId, stage],
      );
      return rows[0]?.ok === true;
    },
  );
}

async function ensureDeepResearchEnabled(adminToken) {
  await api("PUT", "/api/admin/settings/sop.deep_research_enabled", {
    token: adminToken,
    body: { value: { enabled: true } },
  });
}

async function ensureDeepResearchPrompt(adminToken) {
  const prompts = await api("GET", "/api/admin/ai/prompts", { token: adminToken });
  let promptId = prompts.json?.data?.items?.find(
    (p) => p.featureKey === "sop.deep_research",
  )?.id;
  if (!promptId) {
    const np = await api("POST", "/api/admin/ai/prompts", {
      token: adminToken,
      body: {
        featureKey: "sop.deep_research",
        name: "M14 BB Deep Research",
        systemPrompt: "Research: {{sop_media_extracted_text}}",
      },
    });
    promptId = np.json?.data?.id;
    if (promptId) {
      await api("POST", `/api/admin/ai/prompts/${promptId}/publish`, {
        token: adminToken,
      });
    }
  }
  return promptId;
}

function buildM14Steps(drPromptId) {
  return [
    {
      stepCode: "01-A",
      name: "Entry",
      executionType: "manual",
      inputSchema: {},
      dependsOn: [],
      requiresVerification: false,
    },
    {
      stepCode: "02-B",
      name: "Verify step",
      executionType: "manual",
      inputSchema: {},
      dependsOn: ["01-A"],
      requiresVerification: true,
    },
    {
      stepCode: "03-C",
      name: "Deep Research",
      executionType: "async_deep_research",
      aiFeatureKey: "sop.deep_research",
      promptTemplateId: drPromptId,
      inputSchema: {},
      dependsOn: ["02-B"],
      requiresVerification: false,
    },
    {
      stepCode: "04-D",
      name: "HTML deliverable",
      executionType: "manual",
      inputSchema: {},
      dependsOn: ["03-C"],
      requiresVerification: false,
    },
  ];
}

function buildDisabledTestSteps(drPromptId) {
  return [
    {
      stepCode: "01-A",
      name: "Entry",
      executionType: "manual",
      inputSchema: {},
      dependsOn: [],
      requiresVerification: false,
    },
    {
      stepCode: "02-C",
      name: "Deep Research",
      executionType: "async_deep_research",
      aiFeatureKey: "sop.deep_research",
      promptTemplateId: drPromptId,
      inputSchema: {},
      dependsOn: ["01-A"],
      requiresVerification: false,
    },
  ];
}

async function publishTemplate(adminToken, name, steps) {
  const created = await api("POST", "/api/admin/sops/templates", {
    token: adminToken,
    body: { name, caseType: "civil", steps },
  });
  const versionId = created.json?.data?.versionId;
  await api("PUT", `/api/admin/sops/template-versions/${versionId}/prompts`, {
    token: adminToken,
    body: { steps },
  });
  await api("POST", `/api/admin/sops/template-versions/${versionId}/publish`, {
    token: adminToken,
  });
  return versionId;
}

async function advanceManualStep(token, pipelineId, stepCode, formValues) {
  const ex = await api(
    "POST",
    `/api/sops/pipelines/${pipelineId}/steps/${stepCode}/execute`,
    { token, body: { formValues } },
  );
  const fin = await api(
    "POST",
    `/api/sops/pipelines/${pipelineId}/steps/${stepCode}/finalize`,
    { token },
  );
  return { ex, fin, artifactId: ex.json?.data?.artifactId };
}

async function uploadSopMedia(lawyerToken, userId, pipelineId) {
  const init = await api("POST", "/api/sops/uploads/init", {
    token: lawyerToken,
    body: {
      pipelineId,
      fileName: "m14-evidence.mp3",
      mimeType: "audio/mpeg",
      sizeBytes: 8192,
      durationSec: 3,
    },
  });
  const uploadSessionId = init.json?.data?.uploadSessionId;
  const storageObjectKey = init.json?.data?.storageObjectKey;
  if (!uploadSessionId || !storageObjectKey) {
    throw new Error(`upload init failed: ${init.status} ${init.text}`);
  }

  const samplePath = resolve(repoRoot, "e2e/fixtures/test-audio.sample.mp3");
  const buffer = readFileSync(samplePath);
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(storageObjectKey, buffer, {
    upsert: true,
    contentType: "audio/mpeg",
  });
  if (error) {
    throw new Error(`storage upload failed: ${error.message}`);
  }

  const complete = await api("POST", "/api/sops/uploads/complete", {
    token: lawyerToken,
    body: { uploadSessionId },
  });
  return { init, complete, storageObjectKey, userId };
}

async function createLawyer(adminToken, suffix) {
  const username = `m14_bb_${suffix}`;
  const created = await api("POST", "/api/admin/users", {
    token: adminToken,
    body: { username, displayName: `M14 BB ${suffix}`, role: "lawyer" },
  });
  const userId = created.json?.data?.id;
  if ((created.status !== 201 && created.status !== 200) || !userId) {
    throw new Error(`create lawyer failed: ${created.status} ${created.text}`);
  }

  const storage = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: profileError } = await storage
    .from("profiles")
    .update({ requires_password_change: false })
    .eq("id", userId);
  if (profileError) {
    throw new Error(`clear password change flag failed: ${profileError.message}`);
  }

  return login(username);
}

async function main() {
  console.log("=== M14 SOP Worker Blackbox ===\n");

  const health = await api("GET", "/health");
  record(
    "0. API health",
    health.status === 200 && health.json?.success === true,
    `status=${health.status}`,
  );
  if (health.status !== 200) {
    console.error("Start `npm run dev` first.");
    process.exit(1);
  }

  if (!DB_URL?.startsWith("postgresql://")) {
    console.error("SUPABASE_DB_URL / WORKER_DB_URL required.");
    process.exit(1);
  }

  await cleanupOrphanOutbox();

  const admin = await login("admin");
  record("1. Admin login", Boolean(admin.token));
  await ensureDeepResearchEnabled(admin.token);
  const drPromptId = await ensureDeepResearchPrompt(admin.token);

  const suffix = Date.now().toString(36);
  const lawyer = await createLawyer(admin.token, suffix);
  record(
    "2. Lawyer login",
    Boolean(lawyer.token && lawyer.userId),
    `userId=${lawyer.userId?.slice(0, 8)}…`,
  );

  const versionId = await publishTemplate(
    admin.token,
    `M14-BB-${suffix}`,
    buildM14Steps(drPromptId),
  );
  record("3. Publish M14 template", Boolean(versionId), `versionId=${versionId}`);

  const pipe = await api("POST", "/api/sops/pipelines", {
    token: lawyer.token,
    body: { templateVersionId: versionId },
  });
  const pipelineId = pipe.json?.data?.id;
  record(
    "4. Create pipeline",
    pipe.status === 201 && pipelineId,
    `pipelineId=${pipelineId}`,
  );
  if (!pipelineId) {
    console.error("Cannot continue without pipeline.");
    process.exit(1);
  }

  // --- M14-1: sop.media.ocr ---
  let mediaCompleteOk = false;
  let ocrPublished = false;
  let mediaExtracted = false;
  try {
    const media = await uploadSopMedia(lawyer.token, lawyer.userId, pipelineId);
    mediaCompleteOk = media.complete.status === 200;
    record(
      "5. uploads/complete → 200",
      mediaCompleteOk,
      `status=${media.complete.status}`,
    );

    const ocrOutbox = await queryDb(
      `SELECT id, published_at
       FROM public.outbox_events
       WHERE aggregate_id = $1::uuid
         AND payload->>'stage' = 'sop.media.ocr'
       ORDER BY created_at DESC LIMIT 1`,
      [pipelineId],
    );
    record(
      "5b. Outbox sop.media.ocr enqueued",
      ocrOutbox.length === 1,
      `outboxId=${ocrOutbox[0]?.id ?? "none"}`,
    );

    ocrPublished = await waitOutboxPublished(pipelineId, "sop.media.ocr");
    record(
      "5c. Worker consumed sop.media.ocr",
      ocrPublished,
      `published=${ocrPublished}`,
    );

    const extracted = await queryDb(
      `SELECT content_raw
       FROM public.pipeline_artifacts
       WHERE pipeline_id = $1::uuid
         AND step_code = '__sop_media_extracted__'`,
      [pipelineId],
    );
    const ocrJob = ocrOutbox[0]?.id
      ? await queryDb(
          `SELECT status FROM public.pipeline_job_runs
           WHERE outbox_event_id = $1::uuid AND stage = 'sop.media.ocr'
           ORDER BY started_at DESC LIMIT 1`,
          [ocrOutbox[0].id],
        )
      : [];
    mediaExtracted =
      extracted.length === 1 && (extracted[0]?.content_raw?.length ?? 0) > 0;
    const ocrJobRan = ocrJob.length > 0;
    record(
      "5d. Media OCR processed (text persisted or job run recorded)",
      mediaExtracted || ocrJobRan,
      `bytes=${extracted[0]?.content_raw?.length ?? 0} job=${ocrJob[0]?.status ?? "none"}`,
    );
  } catch (error) {
    record("5. Media OCR flow", false, error instanceof Error ? error.message : String(error));
  }

  // --- Advance to DR ---
  const step1 = await advanceManualStep(lawyer.token, pipelineId, "01-A", {
    note: "m14",
  });
  record("6. Step 01-A execute/finalize", step1.fin.status === 200, `fin=${step1.fin.status}`);

  const step2ex = await api("POST", `/api/sops/pipelines/${pipelineId}/steps/02-B/execute`, {
    token: lawyer.token,
    body: { formValues: { draft: "review" } },
  });
  const artifact2 = step2ex.json?.data?.artifactId;
  await api("POST", `/api/sops/artifacts/${artifact2}/verify`, { token: lawyer.token });
  const step2fin = await api(
    "POST",
    `/api/sops/pipelines/${pipelineId}/steps/02-B/finalize`,
    { token: lawyer.token },
  );
  record("7. Step 02-B verify/finalize", step2fin.status === 200, `status=${step2fin.status}`);

  // --- M14-2: async_deep_research ---
  const t0 = Date.now();
  const exDr = await api("POST", `/api/sops/pipelines/${pipelineId}/steps/03-C/execute`, {
    token: lawyer.token,
    body: { formValues: {} },
  });
  const drElapsed = Date.now() - t0;
  const drArtifactId = exDr.json?.data?.artifactId;
  record(
    "8. DR execute → 202 (U2 non-blocking)",
    exDr.status === 202 && drElapsed < 10_000,
    `status=${exDr.status} ms=${drElapsed} artifactId=${drArtifactId}`,
  );

  let drPublished = false;
  let drStatus;
  if (drArtifactId) {
    drPublished = await pollWorkerUntil(
    "DR artifact settled",
    async () => {
      const rows = await queryDb(
        `SELECT status FROM public.pipeline_artifacts
         WHERE id = $1::uuid`,
        [drArtifactId],
      );
      return rows[0]?.status === "draft" || rows[0]?.status === "failed";
    },
    { maxAttempts: 120, intervalMs: 3000 },
    );
    drStatus = (
      await queryDb(`SELECT status FROM public.pipeline_artifacts WHERE id = $1::uuid`, [
        drArtifactId,
      ])
    )[0]?.status;
  }
  record(
    "8b. DR artifact draft or failed",
    drPublished && (drStatus === "draft" || drStatus === "failed"),
    `status=${drStatus}`,
  );

  const drOutboxPub = await queryDb(
    `SELECT published_at IS NOT NULL AS ok
     FROM public.outbox_events
     WHERE aggregate_id = $1::uuid
       AND payload->>'stage' = 'sop.deep_research'
     ORDER BY created_at DESC LIMIT 1`,
    [pipelineId],
  );
  record(
    "8c. sop.deep_research outbox published",
    drOutboxPub[0]?.ok === true,
    `published=${drOutboxPub[0]?.ok}`,
  );

  // --- M14-4: idempotency ---
  const drOutboxId = (
    await queryDb(
      `SELECT id FROM public.outbox_events
       WHERE aggregate_id = $1::uuid
         AND payload->>'stage' = 'sop.deep_research'
       ORDER BY created_at DESC LIMIT 1`,
      [pipelineId],
    )
  )[0]?.id;
  const jobRuns = drOutboxId
    ? await queryDb(
        `SELECT COUNT(*)::int AS cnt
         FROM public.pipeline_job_runs
         WHERE outbox_event_id = $1::uuid
           AND stage = 'sop.deep_research'
           AND status = 'succeeded'`,
        [drOutboxId],
      )
    : [{ cnt: 0 }];
  record(
    "9. Outbox idempotency (one succeeded job run)",
    jobRuns[0]?.cnt === 1,
    `runs=${jobRuns[0]?.cnt} outbox=${drOutboxId?.slice(0, 8)}…`,
  );

  // --- M14-3: sop.pdf_export ---
  if (drStatus === "draft") {
    await api("POST", `/api/sops/pipelines/${pipelineId}/steps/03-C/finalize`, {
      token: lawyer.token,
    });
  }

  const ex4 = await api("POST", `/api/sops/pipelines/${pipelineId}/steps/04-D/execute`, {
    token: lawyer.token,
    body: { formValues: { note: "html step" } },
  });
  const htmlArtifactId = ex4.json?.data?.artifactId;
  await execDb(
    `UPDATE public.pipeline_artifacts
     SET content_type = 'html',
         content_raw = $2
     WHERE id = $1::uuid`,
    [
      htmlArtifactId,
      "<html><body><h1>M14 PDF Test</h1><p>LexOS</p></body></html>",
    ],
  );
  const fin4 = await api("POST", `/api/sops/pipelines/${pipelineId}/steps/04-D/finalize`, {
    token: lawyer.token,
  });
  record(
    "10. HTML finalize → 200",
    fin4.status === 200,
    `artifactId=${htmlArtifactId}`,
  );

  const pdfPublished = await waitOutboxPublished(pipelineId, "sop.pdf_export");
  const htmlRow = (
    await queryDb(
      `SELECT status, linked_drive_node_id
       FROM public.pipeline_artifacts WHERE id = $1::uuid`,
      [htmlArtifactId],
    )
  )[0];
  const pdfKey = `${lawyer.userId}/sops/${pipelineId}/${htmlArtifactId}.pdf`;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const pdfList = await supabase.storage.from(EXPORTS_BUCKET).list(
    `${lawyer.userId}/sops/${pipelineId}`,
  );
  const hasPdfObject =
    !pdfList.error &&
    (pdfList.data ?? []).some((o) => o.name === `${htmlArtifactId}.pdf`);
  record(
    "10b. Worker consumed sop.pdf_export",
    pdfPublished,
    `published=${pdfPublished}`,
  );
  record(
    "10c. Artifact stays finalized (+ optional PDF/drive link)",
    htmlRow?.status === "finalized" && (hasPdfObject || htmlRow?.linked_drive_node_id != null || pdfPublished),
    `status=${htmlRow?.status} pdfInStorage=${hasPdfObject} drive=${htmlRow?.linked_drive_node_id ?? "null"}`,
  );

  // --- M14-5: disabled lawyer ---
  const disabledLawyer = await createLawyer(admin.token, `${suffix}_dis`);
  const disabledVersionId = await publishTemplate(
    admin.token,
    `M14-Disabled-${suffix}`,
    buildDisabledTestSteps(drPromptId),
  );
  const disPipe = await api("POST", "/api/sops/pipelines", {
    token: disabledLawyer.token,
    body: { templateVersionId: disabledVersionId },
  });
  const disPipelineId = disPipe.json?.data?.id;
  await advanceManualStep(disabledLawyer.token, disPipelineId, "01-A", { x: 1 });
  const disDr = await api(
    "POST",
    `/api/sops/pipelines/${disPipelineId}/steps/02-C/execute`,
    { token: disabledLawyer.token, body: { formValues: {} } },
  );
  const disArtifactId = disDr.json?.data?.artifactId;
  await api("PATCH", `/api/admin/users/${disabledLawyer.userId}/status`, {
    token: admin.token,
    body: { status: "disabled" },
  });
  await pollWorkerUntil(
    "disabled lawyer DR handled",
    async () => {
      const rows = await queryDb(
        `SELECT status FROM public.pipeline_artifacts WHERE id = $1::uuid`,
        [disArtifactId],
      );
      return rows[0]?.status === "failed" || rows[0]?.status === "draft";
    },
    { maxAttempts: 60, intervalMs: 2000 },
  );
  const disStatus = (
    await queryDb(`SELECT status FROM public.pipeline_artifacts WHERE id = $1::uuid`, [
      disArtifactId,
    ])
  )[0]?.status;
  record(
    "11. Disabled lawyer — worker does not leave running artifact",
    disStatus === "failed" || disStatus === "draft",
    `status=${disStatus} (failed expected if guard works)`,
  );
  const disFailed = disStatus === "failed";
  record(
    "11b. Disabled lawyer — artifact failed (no silent success)",
    disFailed,
    `status=${disStatus}`,
  );

  console.log("\n=== Summary ===");
  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;
  console.log(`Passed: ${passed}/${results.length}  Failed: ${failed}`);

  if (failed === 0) {
    console.log("\nM14 blackbox: ALL PASSED — update E2E_MANUAL_RUN_LOG.md");
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
