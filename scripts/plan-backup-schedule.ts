import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  buildBackupSchedulePlan,
  formatBackupScheduleMarkdown,
  formatBackupSchedulePlan,
  getBackupOperationsConfigFromEnv,
} from "../src/lib/operations/backup-operations.ts";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const config = getBackupOperationsConfigFromEnv();
const reportDir = readValueArg("--report-dir=") || config.reportDir;
const plan = buildBackupSchedulePlan({
  backupRoot: config.backupRoot,
  dailyTime: readValueArg("--time=") || config.dailyTime,
  projectRoot: process.cwd(),
  rehearsalIntervalDays: config.rehearsalIntervalDays,
  reportDir,
  retentionDays: config.retentionDays,
  timezone: config.timezone,
});

console.log(formatBackupSchedulePlan(plan));

if (plan.blockers.length) {
  process.exitCode = 1;
  process.exit();
}

if (process.argv.includes("--write")) {
  mkdirSync(reportDir, { recursive: true });
  const jsonPath = path.join(reportDir, "backup-schedule-plan.json");
  const markdownPath = path.join(reportDir, "backup-schedule-plan.md");
  writeFileSync(jsonPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
  writeFileSync(markdownPath, formatBackupScheduleMarkdown(plan), "utf8");
  console.log(`备份调度计划已写入：${jsonPath}`);
  console.log(`备份调度说明已写入：${markdownPath}`);
}

function readValueArg(prefix: string): string | undefined {
  const arg = process.argv.find((value) => value.startsWith(prefix));

  return arg?.slice(prefix.length);
}
