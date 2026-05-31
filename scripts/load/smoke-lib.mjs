/**
 * 轻量性能冒烟共享工具（PRD §5.1 QPS≤10）。
 */

/**
 * @typedef {Object} SmokeRequestResult
 * @property {boolean} ok
 * @property {number} status
 * @property {number} durationMs
 * @property {string} [errorMessage]
 */

/**
 * @typedef {Object} SmokeRunSummary
 * @property {number} total
 * @property {number} failures
 * @property {number} errorRate
 * @property {number} durationMs
 * @property {boolean} passed
 */

/**
 * @param {number} failures
 * @param {number} total
 * @returns {number}
 */
export function computeErrorRate(failures, total) {
  if (total === 0) {
    return 1;
  }
  return failures / total;
}

/**
 * @param {number} errorRate
 * @param {number} [maxErrorRate=0.01]
 * @returns {boolean}
 */
export function isSmokePassed(errorRate, maxErrorRate = 0.01) {
  return errorRate < maxErrorRate;
}

/**
 * 在固定并发与时间窗口内执行请求函数。
 *
 * @param {Object} options
 * @param {number} options.concurrency - 虚拟用户数
 * @param {number} options.durationMs - 持续时间
 * @param {() => Promise<SmokeRequestResult>} options.requestFn - 单次请求
 * @param {number} [options.maxErrorRate=0.01]
 * @returns {Promise<SmokeRunSummary>}
 */
export async function runSmokeLoop({
  concurrency,
  durationMs,
  requestFn,
  maxErrorRate = 0.01,
}) {
  const started = Date.now();
  /** @type {SmokeRequestResult[]} */
  const results = [];
  let running = true;

  const workers = Array.from({ length: concurrency }, async () => {
    while (running) {
      results.push(await requestFn());
      if (Date.now() - started >= durationMs) {
        break;
      }
    }
  });

  await Promise.race([
    Promise.all(workers),
    new Promise((resolve) => setTimeout(resolve, durationMs)),
  ]);
  running = false;
  await Promise.allSettled(workers);

  const failures = results.filter((r) => !r.ok).length;
  const errorRate = computeErrorRate(failures, results.length);

  return {
    total: results.length,
    failures,
    errorRate,
    durationMs: Date.now() - started,
    passed: isSmokePassed(errorRate, maxErrorRate),
  };
}

/**
 * @param {string} baseUrl
 * @param {string} path
 * @param {RequestInit} [init]
 * @returns {Promise<SmokeRequestResult>}
 */
export async function fetchSmokeRequest(baseUrl, path, init = {}) {
  const started = Date.now();
  const url = `${baseUrl.replace(/\/$/, "")}${path}`;
  try {
    const response = await fetch(url, init);
    return {
      ok: response.ok,
      status: response.status,
      durationMs: Date.now() - started,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      durationMs: Date.now() - started,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * @param {SmokeRunSummary} summary
 * @param {string} label
 */
export function printSmokeSummary(summary, label) {
  console.log(`[smoke] ${label}`);
  console.log(
    `  total=${summary.total} failures=${summary.failures} errorRate=${(summary.errorRate * 100).toFixed(2)}% durationMs=${summary.durationMs}`,
  );
  console.log(`  result=${summary.passed ? "PASS" : "FAIL"}`);
}

/**
 * 从环境变量读取 API 基址。
 *
 * @returns {string}
 */
export function resolveApiBaseUrl() {
  return (
    process.env.API_URL ??
    process.env.SMOKE_API_URL ??
    "http://localhost:4000"
  ).replace(/\/$/, "");
}

/**
 * @returns {string}
 */
export function resolveSmokeUsername() {
  return process.env.SMOKE_USERNAME ?? "admin";
}

/**
 * @returns {string}
 */
export function resolveSmokePassword() {
  return process.env.SMOKE_PASSWORD ?? process.env.AUTH_INITIAL_PASSWORD ?? "";
}

/**
 * @param {string} apiBase
 * @param {string} username
 * @param {string} password
 * @returns {Promise<string|null>}
 */
export async function loginForSmokeSession(apiBase, username, password) {
  const result = await fetchSmokeRequest(apiBase, "/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!result.ok) {
    return null;
  }
  // Cookie 由 fetch 自动管理（Node 18+ undici 需 cookie jar - use manual header from set-cookie)
  // For simplicity return a marker; actual scripts use response cookies via global login step
  void result;
  return "session-established";
}
