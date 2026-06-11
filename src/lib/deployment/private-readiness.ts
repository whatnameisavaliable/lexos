import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { normalizeSupabaseUrl } from "../supabase/url.ts";

export type PrivateDeploymentMode = "demo" | "supabase";

export type PrivateReadinessInventory = {
  docs: string[];
  migrationFiles: string[];
  packageScripts: string[];
};

export type PrivateDeploymentReadiness = {
  app: "lexos";
  mode: PrivateDeploymentMode;
  ok: boolean;
  supabaseConfigured: boolean;
  missingRequiredEnvKeys: string[];
  missingRecommendedEnvKeys: string[];
  publicSecretEnvKeys: string[];
  migrationSummary: {
    total: number;
    required: number;
    missing: string[];
  };
  scriptSummary: {
    required: number;
    missing: string[];
  };
  docSummary: {
    required: number;
    missing: string[];
  };
  blockers: string[];
  warnings: string[];
};

const requiredSupabaseEnvKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const recommendedPrivateEnvKeys = [
  "LEXOS_DEFAULT_ORGANIZATION_ID",
  "LEXOS_AUTH_EMAIL_DOMAIN",
] as const;

export const requiredPrivateMigrationFiles = [
  "20260606020954_init_lexos_schema.sql",
  "20260606133522_lock_down_direct_table_access.sql",
  "20260608132423_add_deliverable_files.sql",
  "20260609042303_add_task_source_review_scores.sql",
  "20260609042505_add_task_source_review_scores.sql",
  "20260609061000_add_task_review_flow.sql",
  "20260609091825_add_risk_cases.sql",
  "20260609110310_add_risk_case_resolution_note.sql",
  "20260609135059_add_risk_case_defense.sql",
  "20260609144119_add_risk_case_committee_decision.sql",
  "20260609153142_add_settlement_risk_deduction_lock.sql",
  "20260609165248_add_fund_transactions.sql",
] as const;

const requiredPrivatePackageScripts = [
  "build",
  "start",
  "private:check",
  "launch:check",
  "upgrade:check",
  "deploy:channel:check",
  "deploy:upload:check",
  "deploy:preview:request",
  "deploy:preview:evidence",
  "final:acceptance",
  "final:acceptance:archive",
  "final:gate:check",
  "handover:evidence:check",
  "postdeploy:check",
  "release:package:check",
  "release:sensitive:check",
  "ops:log:check",
  "error:log:check",
  "perf:check",
  "tenant:check",
  "backup:db",
  "restore:db",
  "backup:storage",
  "restore:storage",
  "backup:schedule",
  "backup:task:check",
  "backup:run:check",
  "backup:rehearsal",
  "backup:encrypt:check",
  "backup:alert:check",
  "backup:mirror:check",
  "seed:admin",
  "verify:rls",
  "smoke:real",
] as const;

const requiredPrivateDocs = [
  "docs/deployment.md",
  "docs/private-deployment.md",
  "docs/backup-restore.md",
  "docs/storage-backup.md",
  "docs/backup-operations.md",
  "docs/backup-task-installation.md",
  "docs/backup-run-evidence.md",
  "docs/backup-encryption.md",
  "docs/backup-alerts.md",
  "docs/backup-mirror.md",
  "docs/launch-readiness.md",
  "docs/upgrade-runbook.md",
  "docs/deployment-channel.md",
  "docs/vercel-upload-package.md",
  "docs/vercel-preview-request.md",
  "docs/vercel-preview-evidence.md",
  "docs/final-deployment-acceptance.md",
  "docs/final-gate.md",
  "docs/handover-evidence.md",
  "docs/post-deployment-verification.md",
  "docs/release-package.md",
  "docs/release-sensitive-scan.md",
  "docs/operations-log.md",
  "docs/error-log.md",
  "docs/performance-monitoring.md",
  "docs/tenant-isolation.md",
  "docs/database.md",
  "docs/testing.md",
] as const;

const riskyPublicEnvPattern = /(?:SERVICE_ROLE|SECRET|PRIVATE_KEY|DATABASE_URL|DB_PASSWORD|PASSWORD)/i;

export function getPrivateDeploymentMode(env: NodeJS.ProcessEnv = process.env): PrivateDeploymentMode {
  return env.NEXT_PUBLIC_DEMO_MODE === "false" ? "supabase" : "demo";
}

export function readPrivateReadinessInventory(cwd = process.cwd()): PrivateReadinessInventory {
  const migrationsDir = path.join(cwd, "supabase", "migrations");
  const migrationFiles = existsSync(migrationsDir)
    ? readdirSync(migrationsDir).filter((fileName) => fileName.endsWith(".sql"))
    : [];
  const docs = requiredPrivateDocs.filter((docPath) => existsSync(path.join(cwd, ...docPath.split("/"))));
  const packageScripts = readPackageScripts(cwd);

  return {
    docs,
    migrationFiles,
    packageScripts,
  };
}

export function buildPrivateDeploymentReadiness(
  env: NodeJS.ProcessEnv = process.env,
  inventory: PrivateReadinessInventory = readPrivateReadinessInventory(),
): PrivateDeploymentReadiness {
  const mode = getPrivateDeploymentMode(env);
  const missingRequiredEnvKeys = requiredSupabaseEnvKeys.filter((key) => !env[key]);
  const missingRecommendedEnvKeys = recommendedPrivateEnvKeys.filter((key) => !env[key]);
  const publicSecretEnvKeys = Object.keys(env)
    .filter((key) => key.startsWith("NEXT_PUBLIC_"))
    .filter((key) => riskyPublicEnvPattern.test(key));
  const missingMigrations = requiredPrivateMigrationFiles.filter((fileName) => !inventory.migrationFiles.includes(fileName));
  const missingScripts = requiredPrivatePackageScripts.filter((scriptName) => !inventory.packageScripts.includes(scriptName));
  const missingDocs = requiredPrivateDocs.filter((docPath) => !inventory.docs.includes(docPath));
  const blockers: string[] = [];
  const warnings: string[] = [];
  const supabaseConfigured = missingRequiredEnvKeys.length === 0;

  if (mode !== "supabase") {
    blockers.push("私有化部署必须显式设置 NEXT_PUBLIC_DEMO_MODE=false，不能使用内存 demo 模式作为正式交付环境。");
  }

  if (missingRequiredEnvKeys.length) {
    blockers.push(`真实 Supabase 模式缺少必要环境变量：${missingRequiredEnvKeys.join(", ")}。`);
  }

  if (env.SUPABASE_SERVICE_ROLE_KEY && env.NEXT_PUBLIC_SUPABASE_ANON_KEY === env.SUPABASE_SERVICE_ROLE_KEY) {
    blockers.push("SUPABASE_SERVICE_ROLE_KEY 与 NEXT_PUBLIC_SUPABASE_ANON_KEY 不能相同。");
  }

  if (publicSecretEnvKeys.length) {
    blockers.push(`发现疑似公开密钥变量：${publicSecretEnvKeys.join(", ")}。私有密钥不能使用 NEXT_PUBLIC_ 前缀。`);
  }

  if (missingMigrations.length) {
    blockers.push(`关键迁移文件缺失：${missingMigrations.join(", ")}。`);
  }

  if (missingScripts.length) {
    blockers.push(`交付所需 npm scripts 缺失：${missingScripts.join(", ")}。`);
  }

  if (missingDocs.length) {
    blockers.push(`交付文档缺失：${missingDocs.join(", ")}。`);
  }

  if (missingRecommendedEnvKeys.length) {
    warnings.push(`建议补齐环境变量：${missingRecommendedEnvKeys.join(", ")}，避免多环境默认值不一致。`);
  }

  if (env.NEXT_PUBLIC_SUPABASE_URL && normalizeSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL) !== env.NEXT_PUBLIC_SUPABASE_URL) {
    warnings.push("NEXT_PUBLIC_SUPABASE_URL 会被规范化为 Supabase 项目根 URL，请不要填写 /rest/v1 endpoint。");
  }

  warnings.push("本自检只检查本地交付前置条件，不会确认远端数据库是否已经应用全部迁移；上线前仍需执行迁移核对、RLS 验证和真实闭环 smoke。");

  return {
    app: "lexos",
    mode,
    ok: blockers.length === 0,
    supabaseConfigured,
    missingRequiredEnvKeys,
    missingRecommendedEnvKeys,
    publicSecretEnvKeys,
    migrationSummary: {
      total: inventory.migrationFiles.length,
      required: requiredPrivateMigrationFiles.length,
      missing: missingMigrations,
    },
    scriptSummary: {
      required: requiredPrivatePackageScripts.length,
      missing: missingScripts,
    },
    docSummary: {
      required: requiredPrivateDocs.length,
      missing: missingDocs,
    },
    blockers,
    warnings,
  };
}

export function formatPrivateDeploymentReadiness(readiness: PrivateDeploymentReadiness): string {
  const lines = [
    `Lexos 私有化部署自检：${readiness.ok ? "通过" : "未通过"}`,
    `运行模式：${readiness.mode === "supabase" ? "真实 Supabase" : "内存 demo"}`,
    `Supabase 变量：${readiness.supabaseConfigured ? "已配置完整" : "未配置完整"}`,
    `公开密钥风险：${readiness.publicSecretEnvKeys.length ? `发现 ${readiness.publicSecretEnvKeys.length} 项` : "未发现"}`,
    `关键迁移文件：${readiness.migrationSummary.missing.length ? "缺失" : "完整"}（本地共 ${readiness.migrationSummary.total} 个，必需 ${readiness.migrationSummary.required} 个）`,
    `必要 npm scripts：${readiness.scriptSummary.missing.length ? "缺失" : "完整"}（必需 ${readiness.scriptSummary.required} 个）`,
    `交付文档：${readiness.docSummary.missing.length ? "缺失" : "完整"}（必需 ${readiness.docSummary.required} 个）`,
  ];

  if (readiness.blockers.length) {
    lines.push("阻断项：");
    readiness.blockers.forEach((blocker) => {
      lines.push(`- ${blocker}`);
    });
  }

  if (readiness.warnings.length) {
    lines.push("提示：");
    readiness.warnings.forEach((warning) => {
      lines.push(`- ${warning}`);
    });
  }

  return lines.join("\n");
}

function readPackageScripts(cwd: string): string[] {
  const packageJsonPath = path.join(cwd, "package.json");

  if (!existsSync(packageJsonPath)) {
    return [];
  }

  const parsed = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { scripts?: Record<string, unknown> };

  return Object.entries(parsed.scripts ?? {})
    .filter(([, value]) => typeof value === "string")
    .map(([key]) => key);
}
