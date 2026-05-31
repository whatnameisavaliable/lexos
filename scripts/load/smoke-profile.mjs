#!/usr/bin/env node
/**
 * 对已登录会话压测 `GET /api/profile`。
 * 默认：10 并发 VU · 30s · 错误率 < 1%。
 */
import {
  fetchSmokeRequest,
  printSmokeSummary,
  resolveApiBaseUrl,
  resolveSmokePassword,
  resolveSmokeUsername,
  runSmokeLoop,
} from "./smoke-lib.mjs";

/** @type {string|undefined} */
let sessionCookie;

/**
 * @param {string} apiBase
 * @param {string} username
 * @param {string} password
 */
async function establishSession(apiBase, username, password) {
  const loginRes = await fetch(apiBase + "/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const setCookie = loginRes.headers.getSetCookie?.() ?? [];
  sessionCookie = setCookie.map((c) => c.split(";")[0]).join("; ");
  if (!loginRes.ok) {
    throw new Error(`Login failed: HTTP ${loginRes.status}`);
  }
}

async function main() {
  const apiBase = resolveApiBaseUrl();
  const username = resolveSmokeUsername();
  const password = resolveSmokePassword();

  if (!password) {
    console.error("Set SMOKE_PASSWORD or AUTH_INITIAL_PASSWORD");
    process.exit(1);
  }

  await establishSession(apiBase, username, password);

  const summary = await runSmokeLoop({
    concurrency: 10,
    durationMs: 30_000,
    requestFn: async () =>
      fetchSmokeRequest(apiBase, "/api/profile", {
        headers: sessionCookie ? { cookie: sessionCookie } : {},
      }),
  });

  printSmokeSummary(summary, "GET /api/profile");
  process.exit(summary.passed ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
