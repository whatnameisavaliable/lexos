import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  readPrivateReadinessInventory,
  requiredPrivateMigrationFiles,
  type PrivateReadinessInventory,
} from "./private-readiness.ts";

export const RELEASE_PACKAGE_KIND = "lexos-private-release-package";

export type ReleasePackageInventory = PrivateReadinessInventory & {
  directories: string[];
  rootFiles: string[];
};

export type ReleasePackageCheck = {
  version: 1;
  app: "lexos";
  kind: typeof RELEASE_PACKAGE_KIND;
  generatedAt: string;
  releaseVersion: string;
  targetEnvironment: string;
  maintainer: string;
  ok: boolean;
  rootFileSummary: {
    required: number;
    missing: string[];
  };
  directorySummary: {
    required: number;
    missing: string[];
  };
  scriptSummary: {
    required: number;
    missing: string[];
  };
  migrationSummary: {
    required: number;
    missing: string[];
  };
  docSummary: {
    required: number;
    missing: string[];
  };
  excludedPaths: string[];
  blockers: string[];
  warnings: string[];
};

const defaultReleaseVersion = "未指定";
const defaultTargetEnvironment = "未指定";
const defaultMaintainer = "未指定";

const requiredReleaseRootFiles = [
  "package.json",
  "package-lock.json",
  "next.config.mjs",
  "tsconfig.json",
  "tailwind.config.ts",
  "postcss.config.mjs",
  "eslint.config.mjs",
  "playwright.config.ts",
  "playwright.preview.config.ts",
  ".vercelignore",
  ".env.example",
  "README.md",
] as const;

const requiredReleaseDirectories = [
  "app",
  "src",
  "scripts",
  "tests",
  "docs",
  "supabase/migrations",
] as const;

const requiredReleaseScripts = [
  "build",
  "start",
  "verify",
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

const requiredReleaseDocs = [
  "docs/deployment.md",
  "docs/private-deployment.md",
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
  "docs/backup-restore.md",
  "docs/storage-backup.md",
  "docs/backup-operations.md",
  "docs/backup-task-installation.md",
  "docs/backup-run-evidence.md",
  "docs/backup-encryption.md",
  "docs/backup-alerts.md",
  "docs/backup-mirror.md",
  "docs/operations-log.md",
  "docs/error-log.md",
  "docs/performance-monitoring.md",
  "docs/tenant-isolation.md",
  "docs/testing.md",
  "docs/database.md",
] as const;

const excludedReleasePaths = [
  ".env",
  ".env.local",
  ".env.production",
  ".next",
  "node_modules",
  "reports",
  "backups",
  "ops-logs",
  "playwright-report",
  "test-results",
  "coverage",
] as const;

const secretLikePattern = /(?:service_role|database_url|db_url|password|secret|token|private_key|access_key|credential|短信|sms)/i;

export function getReleasePackageConfigFromEnv(env: NodeJS.ProcessEnv = process.env): {
  maintainer: string;
  releaseVersion: string;
  targetEnvironment: string;
} {
  return {
    maintainer: env.LEXOS_RELEASE_PACKAGE_MAINTAINER || defaultMaintainer,
    releaseVersion: env.LEXOS_RELEASE_PACKAGE_VERSION || env.LEXOS_FINAL_ACCEPTANCE_RELEASE_VERSION || defaultReleaseVersion,
    targetEnvironment:
      env.LEXOS_RELEASE_PACKAGE_TARGET_ENV || env.LEXOS_FINAL_ACCEPTANCE_ENVIRONMENT || defaultTargetEnvironment,
  };
}

export function readReleasePackageInventory(cwd = process.cwd()): ReleasePackageInventory {
  const privateInventory = readPrivateReadinessInventory(cwd);

  return {
    ...privateInventory,
    directories: requiredReleaseDirectories.filter((dirPath) => existsSync(path.join(cwd, ...dirPath.split("/")))),
    rootFiles: requiredReleaseRootFiles.filter((filePath) => existsSync(path.join(cwd, filePath))),
  };
}

export function buildReleasePackageCheck(options: {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  generatedAt?: Date;
  inventory?: ReleasePackageInventory;
} = {}): ReleasePackageCheck {
  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const inventory = options.inventory ?? readReleasePackageInventory(cwd);
  const config = getReleasePackageConfigFromEnv(env);
  const missingRootFiles = requiredReleaseRootFiles.filter((filePath) => !inventory.rootFiles.includes(filePath));
  const missingDirectories = requiredReleaseDirectories.filter((dirPath) => !inventory.directories.includes(dirPath));
  const missingScripts = requiredReleaseScripts.filter((scriptName) => !inventory.packageScripts.includes(scriptName));
  const missingMigrations = requiredPrivateMigrationFiles.filter((fileName) => !inventory.migrationFiles.includes(fileName));
  const missingDocs = requiredReleaseDocs.filter((docPath) => !inventory.docs.includes(docPath));
  const presentExcludedPaths = excludedReleasePaths.filter((entryPath) => existsSync(path.join(cwd, entryPath)));
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (config.releaseVersion === defaultReleaseVersion) {
    blockers.push("交付包核对必须指定发布版本，请设置 LEXOS_RELEASE_PACKAGE_VERSION 或 LEXOS_FINAL_ACCEPTANCE_RELEASE_VERSION。");
  }

  if (config.targetEnvironment === defaultTargetEnvironment) {
    blockers.push("交付包核对必须指定目标环境，请设置 LEXOS_RELEASE_PACKAGE_TARGET_ENV 或 LEXOS_FINAL_ACCEPTANCE_ENVIRONMENT。");
  }

  if (config.maintainer === defaultMaintainer) {
    blockers.push("交付包核对必须指定交付维护人，请设置 LEXOS_RELEASE_PACKAGE_MAINTAINER。");
  }

  if (secretLikePattern.test(config.releaseVersion) || secretLikePattern.test(config.targetEnvironment)) {
    blockers.push("发布版本或目标环境只能填写版本号/环境名，不能包含 token、secret、连接串、短信服务或密钥信息。");
  }

  if (missingRootFiles.length) {
    blockers.push(`交付包根文件缺失：${missingRootFiles.join(", ")}。`);
  }

  if (missingDirectories.length) {
    blockers.push(`交付包目录缺失：${missingDirectories.join(", ")}。`);
  }

  if (missingScripts.length) {
    blockers.push(`交付包必备 npm scripts 缺失：${missingScripts.join(", ")}。`);
  }

  if (missingMigrations.length) {
    blockers.push(`交付包关键迁移文件缺失：${missingMigrations.join(", ")}。`);
  }

  if (missingDocs.length) {
    blockers.push(`交付包文档缺失：${missingDocs.join(", ")}。`);
  }

  if (presentExcludedPaths.length) {
    warnings.push(`工作区存在不应进入交付包的本地目录或文件：${presentExcludedPaths.join(", ")}。打包时必须排除。`);
  }

  warnings.push("本命令只核对本地交付清单，不生成压缩包、不读取密钥值、不连接线上 Supabase、不执行迁移或真实 smoke。");
  warnings.push("正式交付包应由负责人使用干净工作区生成，并在归档前复核 .env.local、backups、reports、node_modules 和构建缓存均未进入包内。");

  return {
    version: 1,
    app: "lexos",
    kind: RELEASE_PACKAGE_KIND,
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    releaseVersion: config.releaseVersion,
    targetEnvironment: config.targetEnvironment,
    maintainer: config.maintainer,
    ok: blockers.length === 0,
    rootFileSummary: {
      required: requiredReleaseRootFiles.length,
      missing: missingRootFiles,
    },
    directorySummary: {
      required: requiredReleaseDirectories.length,
      missing: missingDirectories,
    },
    scriptSummary: {
      required: requiredReleaseScripts.length,
      missing: missingScripts,
    },
    migrationSummary: {
      required: requiredPrivateMigrationFiles.length,
      missing: missingMigrations,
    },
    docSummary: {
      required: requiredReleaseDocs.length,
      missing: missingDocs,
    },
    excludedPaths: [...excludedReleasePaths],
    blockers,
    warnings,
  };
}

export function formatReleasePackageCheck(check: ReleasePackageCheck): string {
  const lines = [
    "# Lexos 私有化交付包清单核对",
    "",
    `生成时间：${check.generatedAt}`,
    `总体状态：${check.ok ? "通过" : "存在阻断项"}`,
    `发布版本：${check.releaseVersion}`,
    `目标环境：${check.targetEnvironment}`,
    `交付维护人：${check.maintainer}`,
    `根文件：${check.rootFileSummary.missing.length ? "缺失" : "完整"}（必需 ${check.rootFileSummary.required} 项）`,
    `目录：${check.directorySummary.missing.length ? "缺失" : "完整"}（必需 ${check.directorySummary.required} 项）`,
    `npm scripts：${check.scriptSummary.missing.length ? "缺失" : "完整"}（必需 ${check.scriptSummary.required} 项）`,
    `迁移文件：${check.migrationSummary.missing.length ? "缺失" : "完整"}（必需 ${check.migrationSummary.required} 项）`,
    `文档：${check.docSummary.missing.length ? "缺失" : "完整"}（必需 ${check.docSummary.required} 项）`,
    "",
  ];

  if (check.blockers.length) {
    lines.push("## 阻断项", "");
    check.blockers.forEach((blocker) => lines.push(`- ${blocker}`));
    lines.push("");
  }

  if (check.warnings.length) {
    lines.push("## 提示", "");
    check.warnings.forEach((warning) => lines.push(`- ${warning}`));
    lines.push("");
  }

  lines.push("## 必须排除的本地路径", "");
  check.excludedPaths.forEach((entryPath) => lines.push(`- ${entryPath}`));
  lines.push("");
  lines.push("## 交付边界", "");
  lines.push("- 不包含 `.env.local`、真实密钥、数据库连接串、备份原件、验收证据包、构建缓存或依赖目录。");
  lines.push("- 不包含真实短信接入、证据矩阵、AI 辅助、新手保护期或新兵引流池功能。");
  lines.push("- 线上迁移、RLS 验证、真实闭环 smoke 和最终签收仍需在目标环境单独执行并归档证据。");

  return lines.join("\n").trimEnd();
}

export function readPackageScriptsForRelease(cwd: string): string[] {
  const packageJsonPath = path.join(cwd, "package.json");

  if (!existsSync(packageJsonPath)) {
    return [];
  }

  const parsed = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { scripts?: Record<string, unknown> };

  return Object.entries(parsed.scripts ?? {})
    .filter(([, value]) => typeof value === "string")
    .map(([key]) => key);
}
