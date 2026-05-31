#!/usr/bin/env node
/**
 * 对 `POST /api/auth/login` + `GET /api/auth/session` 轻量冒烟。
 * 默认：10 并发 VU · 30s · 错误率 < 1%（PRD §5.1 QPS≤10）。
 *
 * 环境变量：`API_URL`、`SMOKE_USERNAME`、`SMOKE_PASSWORD`（或 `AUTH_INITIAL_PASSWORD`）
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
    requestFn: async () => {
      const login = await fetchSmokeRequest(apiBase, "/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const session = await fetchSmokeRequest(apiBase, "/api/auth/session", {
        headers: sessionCookie ? { cookie: sessionCookie } : {},
      });
      return {
        ok: login.ok && session.ok,
        status: session.status,
        durationMs: login.durationMs + session.durationMs,
      };
    },
  });

  printSmokeSummary(summary, "auth login + session");
  process.exit(summary.passed ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
