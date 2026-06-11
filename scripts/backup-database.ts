import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import process from "node:process";

import {
  buildDatabaseBackupPlan,
  formatDatabaseBackupPlan,
  getDatabaseBackupSchemas,
  getDatabaseUrlFromEnv,
} from "../src/lib/operations/database-backup.ts";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const dryRun = process.argv.includes("--dry-run") || process.env.LEXOS_BACKUP_DRY_RUN === "true";
const backupRoot = process.env.LEXOS_BACKUP_DIR || "backups";
const plan = buildDatabaseBackupPlan({
  backupRoot,
  databaseUrl: getDatabaseUrlFromEnv(),
  dryRun,
  schemas: getDatabaseBackupSchemas(),
});

console.log(formatDatabaseBackupPlan(plan));

if (!plan.ok) {
  process.exitCode = 1;
  process.exit();
}

if (plan.dryRun) {
  process.exit();
}

mkdirSync(plan.backupDir, { recursive: true });

for (const command of plan.commands) {
  const result = spawnSync(command.command, command.args, {
    env: {
      ...process.env,
      SUPABASE_TELEMETRY_DISABLED: "1",
    },
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    process.exit();
  }
}

writeFileSync(plan.manifestPath, `${JSON.stringify(plan.manifest, null, 2)}\n`, "utf8");
console.log(`备份 manifest 已写入：${plan.manifestPath}`);
