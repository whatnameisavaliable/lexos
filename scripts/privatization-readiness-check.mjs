import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * @typedef {Object} ReadinessCheckResult
 * @property {string} name
 * @property {boolean} passed
 * @property {string} message
 */

/**
 * @param {string} name
 * @param {boolean} passed
 * @param {string} message
 * @returns {ReadinessCheckResult}
 */
function createResult(name, passed, message) {
  return { name, passed, message };
}

/**
 * 解析 `.env` 风格键值（忽略注释与空行）。
 *
 * @param {string} content - 文件文本
 * @returns {Map<string, string>}
 */
export function parseEnvFile(content) {
  /** @type {Map<string, string>} */
  const map = new Map();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map.set(key, value);
  }
  return map;
}

/**
 * `CAPTCHA_PROVIDER=none` 时须配置 `LOGIN_IP_ALLOWLIST`（architecture.md §4.2.3）。
 *
 * @param {Map<string, string>} env
 * @returns {ReadinessCheckResult}
 */
export function checkCaptchaAllowlist(env) {
  const provider = (env.get("CAPTCHA_PROVIDER") ?? "").toLowerCase();
  if (provider !== "none") {
    return createResult(
      "captcha_allowlist",
      true,
      `CAPTCHA_PROVIDER=${provider}; LOGIN_IP_ALLOWLIST not required`,
    );
  }
  const allowlist = env.get("LOGIN_IP_ALLOWLIST")?.trim() ?? "";
  const passed = allowlist.length > 0;
  return createResult(
    "captcha_allowlist",
    passed,
    passed
      ? "CAPTCHA_PROVIDER=none with LOGIN_IP_ALLOWLIST configured"
      : "CAPTCHA_PROVIDER=none requires non-empty LOGIN_IP_ALLOWLIST",
  );
}

/**
 * 生产模板须声明 FFmpeg / Worker 并发 / AI 加密密钥变量（不要求 REDIS_URL）。
 *
 * @param {Map<string, string>} env
 * @returns {ReadinessCheckResult}
 */
export function checkProductionRequiredKeys(env) {
  const required = [
    "FFMPEG_PATH",
    "WORKER_MAX_CONCURRENCY",
    "AI_CREDENTIALS_ENCRYPTION_KEY",
  ];
  const missing = required.filter((key) => !env.has(key));
  const passed = missing.length === 0;
  return createResult(
    "production_required_keys",
    passed,
    passed
      ? "Production template declares FFMPEG_PATH, WORKER_MAX_CONCURRENCY, AI_CREDENTIALS_ENCRYPTION_KEY"
      : `Missing keys in production template: ${missing.join(", ")}`,
  );
}

/**
 * `REALTIME_ENABLED` 不得默认开启（architecture.md §3.4.3）。
 *
 * @param {Map<string, string>} env
 * @returns {ReadinessCheckResult}
 */
export function checkRealtimeDefault(env) {
  const raw = env.get("REALTIME_ENABLED");
  if (raw === undefined) {
    return createResult(
      "realtime_default",
      true,
      "REALTIME_ENABLED not set (implicit false)",
    );
  }
  const normalized = raw.trim().toLowerCase();
  const passed =
    normalized !== "true" && normalized !== "1" && normalized !== "yes";
  return createResult(
    "realtime_default",
    passed,
    passed
      ? `REALTIME_ENABLED=${raw} (not enabled by default)`
      : "REALTIME_ENABLED must not default to true in production template",
  );
}

/**
 * 对生产模板内容执行全部私有化就绪检查。
 *
 * @param {string} templateContent - `.env.production.example` 文本
 * @returns {ReadinessCheckResult[]}
 */
export function runPrivatizationReadinessChecks(templateContent) {
  const env = parseEnvFile(templateContent);
  return [
    checkCaptchaAllowlist(env),
    checkProductionRequiredKeys(env),
    checkRealtimeDefault(env),
  ];
}

/**
 * CLI：读取 repo 根目录 `.env.production.example` 并输出结果。
 *
 * @param {string} repoRoot - monorepo 根目录
 * @returns {number} 退出码 0 = 全通过
 */
export function runPrivatizationReadinessCli(repoRoot) {
  const templatePath = path.join(repoRoot, ".env.production.example");
  if (!fs.existsSync(templatePath)) {
    console.error(`Missing ${templatePath}`);
    return 1;
  }
  const content = fs.readFileSync(templatePath, "utf8");
  const results = runPrivatizationReadinessChecks(content);

  let exitCode = 0;
  for (const result of results) {
    const status = result.passed ? "PASS" : "FAIL";
    console.log(`[${status}] ${result.name}: ${result.message}`);
    if (!result.passed) {
      exitCode = 1;
    }
  }
  return exitCode;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  process.exit(runPrivatizationReadinessCli(repoRoot));
}
