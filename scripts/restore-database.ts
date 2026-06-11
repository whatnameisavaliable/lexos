import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import process from "node:process";

import {
  buildDatabaseRestorePlan,
  DATABASE_BACKUP_MANIFEST_FILE,
  formatDatabaseRestorePlan,
  getDatabaseUrlFromEnv,
  type DatabaseBackupManifest,
} from "../src/lib/operations/database-backup.ts";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const backupDir = readBackupDirArg() || process.env.LEXOS_RESTORE_BACKUP_DIR || "";
const executeRequested = process.argv.includes("--execute") || process.env.LEXOS_RESTORE_EXECUTE === "true";
const applyRoles = process.argv.includes("--apply-roles") || process.env.LEXOS_RESTORE_APPLY_ROLES === "true";
const existingFiles = backupDir && existsSync(backupDir) ? readdirSync(backupDir) : [];
const manifest = backupDir ? readManifest(backupDir) : undefined;
const plan = buildDatabaseRestorePlan({
  applyRoles,
  backupDir,
  confirmation: process.env.LEXOS_RESTORE_CONFIRM,
  databaseUrl: getDatabaseUrlFromEnv(),
  executeRequested,
  existingFiles,
  manifest,
});

console.log(formatDatabaseRestorePlan(plan));

if (!plan.ok) {
  process.exitCode = 1;
  process.exit();
}

if (plan.dryRun) {
  console.log("当前仅为恢复演练。如需执行，请追加 --execute 并设置 LEXOS_RESTORE_CONFIRM=RESTORE_LEXOS_DATABASE。");
  process.exit();
}

for (const command of plan.commands) {
  const result = spawnSync(command.command, command.args, {
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    process.exit();
  }
}

console.log("数据库恢复脚本执行完成。请继续运行 npm run verify:rls 和真实闭环 smoke。");

function readBackupDirArg(): string | undefined {
  const arg = process.argv.find((value) => value.startsWith("--backup-dir="));

  return arg?.slice("--backup-dir=".length);
}

function readManifest(backupDirPath: string): DatabaseBackupManifest | undefined {
  const manifestPath = `${backupDirPath.replace(/[\\/]$/, "")}/${DATABASE_BACKUP_MANIFEST_FILE}`;

  if (!existsSync(manifestPath)) {
    return undefined;
  }

  return JSON.parse(readFileSync(manifestPath, "utf8").replace(/^\uFEFF/, "")) as DatabaseBackupManifest;
}
