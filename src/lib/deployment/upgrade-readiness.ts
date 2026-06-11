import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  buildPrivateDeploymentReadiness,
  readPrivateReadinessInventory,
  requiredPrivateMigrationFiles,
  type PrivateReadinessInventory,
} from "./private-readiness.ts";

export type UpgradeMigrationStatus = "applied" | "pending" | "manual-check";

export type UpgradeMigrationItem = {
  fileName: string;
  required: boolean;
  status: UpgradeMigrationStatus;
  notes: string[];
};

export type UpgradeReadinessPlan = {
  app: "lexos";
  ok: boolean;
  generatedAt: string;
  fromVersion: string;
  targetVersion: string;
  appliedMigrationSource: "env" | "none";
  migrationSummary: {
    totalLocal: number;
    required: number;
    applied: number;
    pending: number;
    manualCheck: number;
    missingRequired: string[];
  };
  migrations: UpgradeMigrationItem[];
  commands: {
    preUpgrade: string[];
    migrationCheck: string[];
    postUpgrade: string[];
    rollbackEvidence: string[];
  };
  blockers: string[];
  warnings: string[];
};

const optionalCompatibilityMigrations = [
  "20260606105523_lexos_online_compatibility_bootstrap.sql",
] as const;

const requiredUpgradeScripts = [
  "private:check",
  "launch:check",
  "upgrade:check",
  "backup:db",
  "backup:storage",
  "backup:rehearsal",
  "verify:rls",
  "smoke:real",
  "build",
] as const;

export function buildUpgradeReadinessPlan(options: {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  generatedAt?: Date;
  inventory?: PrivateReadinessInventory;
} = {}): UpgradeReadinessPlan {
  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const inventory = options.inventory ?? readPrivateReadinessInventory(cwd);
  const privateReadiness = buildPrivateDeploymentReadiness(env, inventory);
  const packageVersion = readPackageVersion(cwd);
  const appliedMigrations = parseAppliedMigrations(env.LEXOS_UPGRADE_APPLIED_MIGRATIONS);
  const appliedMigrationSource = appliedMigrations.length ? "env" : "none";
  const missingRequired = requiredPrivateMigrationFiles.filter((fileName) => !inventory.migrationFiles.includes(fileName));
  const missingScripts = requiredUpgradeScripts.filter((scriptName) => !inventory.packageScripts.includes(scriptName));
  const migrations = buildMigrationItems(inventory.migrationFiles, appliedMigrations);
  const blockers = [
    ...privateReadiness.blockers,
    ...missingRequired.map((fileName) => `升级必需迁移文件缺失：${fileName}。`),
    ...missingScripts.map((scriptName) => `升级核对所需 npm script 缺失：${scriptName}。`),
  ];
  const warnings = [
    ...privateReadiness.warnings,
    "升级核对脚本只读取本地文件和环境变量，不会连接远端 Supabase，也不会执行迁移。",
    "如果未设置 LEXOS_UPGRADE_APPLIED_MIGRATIONS，迁移状态会全部标记为人工核对。",
  ];

  if (!env.LEXOS_UPGRADE_FROM_VERSION) {
    warnings.push("建议设置 LEXOS_UPGRADE_FROM_VERSION，便于交付记录中标明升级来源版本。");
  }

  return {
    app: "lexos",
    ok: blockers.length === 0,
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    fromVersion: env.LEXOS_UPGRADE_FROM_VERSION || "未提供",
    targetVersion: env.LEXOS_UPGRADE_TARGET_VERSION || packageVersion,
    appliedMigrationSource,
    migrationSummary: summarizeMigrations(inventory.migrationFiles, migrations, missingRequired),
    migrations,
    commands: {
      preUpgrade: [
        "npm.cmd run private:check",
        "npm.cmd run launch:check",
        "npm.cmd run upgrade:check",
        "npm.cmd run backup:db",
        "npm.cmd run backup:storage",
        "npm.cmd run backup:rehearsal -- --latest",
      ],
      migrationCheck: [
        "supabase migration list",
        "supabase db push",
      ],
      postUpgrade: [
        "npm.cmd run build",
        "npm.cmd run verify:rls",
        "npm.cmd run smoke:real",
      ],
      rollbackEvidence: [
        "升级前数据库备份目录",
        "升级前 Storage 备份目录",
        "升级前应用版本和 commit",
        "迁移执行记录和失败日志",
      ],
    },
    blockers,
    warnings,
  };
}

export function formatUpgradeReadinessMarkdown(plan: UpgradeReadinessPlan): string {
  const lines = [
    "# Lexos 升级迁移核对计划",
    "",
    `生成时间：${plan.generatedAt}`,
    `总体状态：${plan.ok ? "可进入人工升级核对" : "存在阻断项"}`,
    `来源版本：${plan.fromVersion}`,
    `目标版本：${plan.targetVersion}`,
    `迁移状态来源：${plan.appliedMigrationSource === "env" ? "LEXOS_UPGRADE_APPLIED_MIGRATIONS" : "未提供，需人工核对"}`,
    `迁移摘要：必需 ${plan.migrationSummary.required} 个，已应用 ${plan.migrationSummary.applied} 个，待应用 ${plan.migrationSummary.pending} 个，人工核对 ${plan.migrationSummary.manualCheck} 个`,
    "",
    formatIssueList("阻断项", plan.blockers),
    formatIssueList("提示", plan.warnings),
    "",
    "## 升级前命令",
    ...plan.commands.preUpgrade.map((command) => `- \`${command}\``),
    "",
    "## 迁移核对",
    ...plan.migrations.map((migration) => {
      const requiredLabel = migration.required ? "必需" : "兼容/可选";
      const note = migration.notes.length ? `；${migration.notes.join("；")}` : "";

      return `- ${migration.fileName}：${requiredLabel}，${formatMigrationStatus(migration.status)}${note}`;
    }),
    "",
    "## 人工迁移命令",
    ...plan.commands.migrationCheck.map((command) => `- \`${command}\``),
    "",
    "## 升级后验证",
    ...plan.commands.postUpgrade.map((command) => `- \`${command}\``),
    "",
    "## 回滚证据",
    ...plan.commands.rollbackEvidence.map((item) => `- ${item}`),
  ].filter((line) => line !== undefined);

  return lines.join("\n").trimEnd();
}

export function parseAppliedMigrations(value?: string): string[] {
  if (!value) {
    return [];
  }

  return Array.from(new Set(value
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.endsWith(".sql") ? item : `${item}.sql`)));
}

function buildMigrationItems(localMigrationFiles: string[], appliedMigrations: string[]): UpgradeMigrationItem[] {
  const requiredSet = new Set<string>(requiredPrivateMigrationFiles);
  const optionalSet = new Set<string>(optionalCompatibilityMigrations);
  const appliedSet = new Set<string>(appliedMigrations);
  const catalog = Array.from(new Set([...localMigrationFiles, ...requiredPrivateMigrationFiles, ...optionalCompatibilityMigrations]))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();

  return catalog.map((fileName) => {
    const required = requiredSet.has(fileName);
    const status = appliedMigrations.length
      ? appliedSet.has(fileName) ? "applied" : "pending"
      : "manual-check";
    const notes: string[] = [];

    if (optionalSet.has(fileName)) {
      notes.push("仅兼容已有空表项目，干净库通常不需要单独使用");
    }

    if (!localMigrationFiles.includes(fileName)) {
      notes.push("本地迁移目录缺失");
    }

    return {
      fileName,
      required,
      status,
      notes,
    };
  });
}

function summarizeMigrations(
  localMigrationFiles: string[],
  migrations: UpgradeMigrationItem[],
  missingRequired: string[],
): UpgradeReadinessPlan["migrationSummary"] {
  return {
    totalLocal: localMigrationFiles.length,
    required: requiredPrivateMigrationFiles.length,
    applied: migrations.filter((migration) => migration.required && migration.status === "applied").length,
    pending: migrations.filter((migration) => migration.required && migration.status === "pending").length,
    manualCheck: migrations.filter((migration) => migration.required && migration.status === "manual-check").length,
    missingRequired,
  };
}

function readPackageVersion(cwd: string): string {
  const packageJsonPath = path.join(cwd, "package.json");

  if (!existsSync(packageJsonPath)) {
    return "未提供";
  }

  const parsed = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { version?: string };

  return parsed.version || "未提供";
}

function formatMigrationStatus(status: UpgradeMigrationStatus): string {
  if (status === "applied") {
    return "已应用";
  }

  if (status === "pending") {
    return "待应用";
  }

  return "需人工核对";
}

function formatIssueList(title: string, issues: string[]): string | undefined {
  if (!issues.length) {
    return undefined;
  }

  return [
    `${title}：`,
    ...issues.map((issue) => `- ${issue}`),
  ].join("\n");
}
