import path from "node:path";

import {
  buildDatabaseRestorePlan,
  DATABASE_BACKUP_MANIFEST_FILE,
  type DatabaseBackupManifest,
  type DatabaseRestorePlan,
} from "./database-backup.ts";
import {
  buildStorageRestorePlan,
  STORAGE_BACKUP_MANIFEST_FILE,
  type StorageBackupManifest,
  type StorageRestorePlan,
} from "./storage-backup.ts";

export const BACKUP_OPERATIONS_REPORT_KIND = "lexos-backup-rehearsal-report";
export const BACKUP_OPERATIONS_PLAN_KIND = "lexos-backup-schedule-plan";
export const DEFAULT_BACKUP_REPORT_DIR = "backups/reports";
export const DEFAULT_BACKUP_SCHEDULE_TIME = "02:30";
export const DEFAULT_BACKUP_RETENTION_DAYS = 30;
export const DEFAULT_BACKUP_REHEARSAL_INTERVAL_DAYS = 30;

export type BackupDailyTime = {
  hour: number;
  minute: number;
  value: string;
};

export type BackupSchedulePlan = {
  version: 1;
  app: "lexos";
  kind: typeof BACKUP_OPERATIONS_PLAN_KIND;
  generatedAt: string;
  projectRoot: string;
  backupRoot: string;
  reportDir: string;
  timezone: string;
  dailyTime: BackupDailyTime;
  retentionDays: number;
  rehearsalIntervalDays: number;
  commands: {
    dailyBackup: string[];
    weeklyRehearsal: string[];
  };
  windowsTaskScheduler: {
    dailyBackup: string;
    weeklyRehearsal: string;
  };
  cronEntries: {
    dailyBackup: string;
    weeklyRehearsal: string;
  };
  blockers: string[];
  warnings: string[];
};

export type BackupRehearsalReport = {
  version: 1;
  app: "lexos";
  kind: typeof BACKUP_OPERATIONS_REPORT_KIND;
  rehearsalId: string;
  generatedAt: string;
  database: {
    backupDir: string;
    manifest?: DatabaseBackupManifest;
    restorePlan: DatabaseRestorePlan;
  };
  storage: {
    backupDir: string;
    manifest?: StorageBackupManifest;
    restorePlan: StorageRestorePlan;
  };
  ok: boolean;
  blockers: string[];
  warnings: string[];
  nextActions: string[];
};

const timestampFormatter = new Intl.DateTimeFormat("sv-SE", {
  day: "2-digit",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  month: "2-digit",
  second: "2-digit",
  timeZone: "Asia/Shanghai",
  year: "numeric",
});

export function getBackupOperationsConfigFromEnv(env: NodeJS.ProcessEnv = process.env): {
  backupRoot: string;
  dailyTime: string;
  rehearsalIntervalDays: number;
  reportDir: string;
  retentionDays: number;
  timezone: string;
} {
  return {
    backupRoot: env.LEXOS_BACKUP_DIR || "backups",
    dailyTime: env.LEXOS_BACKUP_SCHEDULE_TIME || DEFAULT_BACKUP_SCHEDULE_TIME,
    rehearsalIntervalDays: parsePositiveInteger(
      env.LEXOS_BACKUP_REHEARSAL_INTERVAL_DAYS,
      DEFAULT_BACKUP_REHEARSAL_INTERVAL_DAYS,
    ),
    reportDir: env.LEXOS_BACKUP_REPORT_DIR || DEFAULT_BACKUP_REPORT_DIR,
    retentionDays: parsePositiveInteger(env.LEXOS_BACKUP_RETENTION_DAYS, DEFAULT_BACKUP_RETENTION_DAYS),
    timezone: env.LEXOS_BACKUP_TIMEZONE || "Asia/Shanghai",
  };
}

export function createBackupRehearsalId(now = new Date()): string {
  const formatted = timestampFormatter
    .format(now)
    .replace(" ", "-")
    .replaceAll("-", "")
    .replaceAll(":", "");

  return `lexos-rehearsal-${formatted}`;
}

export function parseBackupDailyTime(value: string): BackupDailyTime {
  const trimmed = value.trim();
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(trimmed);

  if (!match) {
    throw new Error("备份执行时间必须使用 HH:mm 24 小时格式，例如 02:30。");
  }

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
    value: trimmed,
  };
}

export function buildBackupSchedulePlan(options: {
  backupRoot?: string;
  dailyTime?: string;
  now?: Date;
  projectRoot?: string;
  rehearsalIntervalDays?: number;
  reportDir?: string;
  retentionDays?: number;
  timezone?: string;
}): BackupSchedulePlan {
  const projectRoot = options.projectRoot ?? process.cwd();
  const backupRoot = options.backupRoot ?? "backups";
  const reportDir = options.reportDir ?? DEFAULT_BACKUP_REPORT_DIR;
  const retentionDays = options.retentionDays ?? DEFAULT_BACKUP_RETENTION_DAYS;
  const rehearsalIntervalDays = options.rehearsalIntervalDays ?? DEFAULT_BACKUP_REHEARSAL_INTERVAL_DAYS;
  const dailyTime = parseBackupDailyTime(options.dailyTime ?? DEFAULT_BACKUP_SCHEDULE_TIME);
  const blockers: string[] = [];
  const warnings = [
    "本计划只生成运维调度建议，不会自动创建 Windows 任务计划或 Linux cron。",
    "真实生产环境应由律所运维在受控账号下安装计划任务，并将日志、备份目录和离线加密流程纳入运维制度。",
  ];

  if (retentionDays < 7) {
    blockers.push("备份保留天数不能小于 7 天。");
  }

  if (rehearsalIntervalDays < 7) {
    blockers.push("恢复演练间隔不能小于 7 天。");
  }

  const dailyBackupCommands = ["npm.cmd run backup:db", "npm.cmd run backup:storage"];
  const weeklyRehearsalCommands = ["npm.cmd run backup:rehearsal -- --latest"];

  return {
    version: 1,
    app: "lexos",
    kind: BACKUP_OPERATIONS_PLAN_KIND,
    generatedAt: (options.now ?? new Date()).toISOString(),
    projectRoot,
    backupRoot,
    reportDir,
    timezone: options.timezone ?? "Asia/Shanghai",
    dailyTime,
    retentionDays,
    rehearsalIntervalDays,
    commands: {
      dailyBackup: dailyBackupCommands,
      weeklyRehearsal: weeklyRehearsalCommands,
    },
    windowsTaskScheduler: {
      dailyBackup: buildWindowsTaskCommand("Lexos Daily Backup", "DAILY", dailyTime.value, projectRoot, dailyBackupCommands),
      weeklyRehearsal: buildWindowsTaskCommand("Lexos Weekly Backup Rehearsal", "WEEKLY", dailyTime.value, projectRoot, weeklyRehearsalCommands),
    },
    cronEntries: {
      dailyBackup: buildCronEntry(dailyTime, "* * *", projectRoot, dailyBackupCommands),
      weeklyRehearsal: buildCronEntry(dailyTime, "* * 0", projectRoot, weeklyRehearsalCommands),
    },
    blockers,
    warnings,
  };
}

export function buildBackupRehearsalReport(input: {
  databaseBackupDir: string;
  databaseExistingFiles: string[];
  databaseManifest?: DatabaseBackupManifest;
  generatedAt?: Date;
  rehearsalId?: string;
  storageBackupDir: string;
  storageExistingFiles: string[];
  storageManifest?: StorageBackupManifest;
}): BackupRehearsalReport {
  const databaseRestorePlan = buildDatabaseRestorePlan({
    backupDir: input.databaseBackupDir,
    existingFiles: input.databaseExistingFiles,
    manifest: input.databaseManifest,
  });
  const storageRestorePlan = buildStorageRestorePlan({
    backupDir: input.storageBackupDir,
    existingFiles: input.storageExistingFiles,
    manifest: input.storageManifest,
  });
  const blockers = [
    ...databaseRestorePlan.blockers.map((blocker) => `数据库：${blocker}`),
    ...storageRestorePlan.blockers.map((blocker) => `Storage：${blocker}`),
  ];
  const warnings = [
    "恢复演练报告只校验备份目录、manifest 和必要文件，不执行 psql 写入，也不上传 Storage 对象。",
    "正式恢复前仍需在隔离验收环境执行完整恢复、RLS 验证、真实闭环 smoke 和附件下载核对。",
    ...databaseRestorePlan.warnings.map((warning) => `数据库：${warning}`),
    ...storageRestorePlan.warnings.map((warning) => `Storage：${warning}`),
  ];

  return {
    version: 1,
    app: "lexos",
    kind: BACKUP_OPERATIONS_REPORT_KIND,
    rehearsalId: input.rehearsalId ?? createBackupRehearsalId(input.generatedAt),
    generatedAt: (input.generatedAt ?? new Date()).toISOString(),
    database: {
      backupDir: input.databaseBackupDir,
      manifest: input.databaseManifest,
      restorePlan: databaseRestorePlan,
    },
    storage: {
      backupDir: input.storageBackupDir,
      manifest: input.storageManifest,
      restorePlan: storageRestorePlan,
    },
    ok: blockers.length === 0,
    blockers,
    warnings,
    nextActions: buildRehearsalNextActions(blockers.length === 0),
  };
}

export function formatBackupSchedulePlan(plan: BackupSchedulePlan): string {
  return [
    `Lexos 备份定时调度计划：${plan.blockers.length ? "未通过" : "可采用"}`,
    `项目目录：${plan.projectRoot}`,
    `备份目录：${plan.backupRoot}`,
    `报告目录：${plan.reportDir}`,
    `每日备份时间：${plan.dailyTime.value}（${plan.timezone}）`,
    `备份保留天数：${plan.retentionDays}`,
    `恢复演练间隔：${plan.rehearsalIntervalDays} 天`,
    "每日备份命令：",
    ...plan.commands.dailyBackup.map((command) => `- ${command}`),
    "恢复演练命令：",
    ...plan.commands.weeklyRehearsal.map((command) => `- ${command}`),
    "Windows Task Scheduler 示例：",
    `- ${plan.windowsTaskScheduler.dailyBackup}`,
    `- ${plan.windowsTaskScheduler.weeklyRehearsal}`,
    "Linux cron 示例：",
    `- ${plan.cronEntries.dailyBackup}`,
    `- ${plan.cronEntries.weeklyRehearsal}`,
    formatIssues("阻断项", plan.blockers),
    formatIssues("提示", plan.warnings),
  ].filter(Boolean).join("\n");
}

export function formatBackupScheduleMarkdown(plan: BackupSchedulePlan): string {
  return [
    "# Lexos 备份定时调度计划",
    "",
    `- 生成时间：${plan.generatedAt}`,
    `- 项目目录：${plan.projectRoot}`,
    `- 备份目录：${plan.backupRoot}`,
    `- 报告目录：${plan.reportDir}`,
    `- 每日备份时间：${plan.dailyTime.value}（${plan.timezone}）`,
    `- 备份保留天数：${plan.retentionDays}`,
    `- 恢复演练间隔：${plan.rehearsalIntervalDays} 天`,
    "",
    "## 每日备份命令",
    "",
    ...plan.commands.dailyBackup.map((command) => `- \`${command}\``),
    "",
    "## 恢复演练命令",
    "",
    ...plan.commands.weeklyRehearsal.map((command) => `- \`${command}\``),
    "",
    "## Windows Task Scheduler 示例",
    "",
    "```powershell",
    plan.windowsTaskScheduler.dailyBackup,
    plan.windowsTaskScheduler.weeklyRehearsal,
    "```",
    "",
    "## Linux cron 示例",
    "",
    "```cron",
    plan.cronEntries.dailyBackup,
    plan.cronEntries.weeklyRehearsal,
    "```",
    "",
    "## 提示",
    "",
    ...plan.warnings.map((warning) => `- ${warning}`),
    "",
  ].join("\n");
}

export function formatBackupRehearsalReport(report: BackupRehearsalReport): string {
  return [
    `Lexos 备份恢复演练报告：${report.ok ? "通过" : "未通过"}`,
    `演练 ID：${report.rehearsalId}`,
    `数据库备份目录：${report.database.backupDir || "未配置"}`,
    `Storage 备份目录：${report.storage.backupDir || "未配置"}`,
    `数据库文件缺失：${report.database.restorePlan.missingFiles.length ? report.database.restorePlan.missingFiles.join(", ") : "无"}`,
    `Storage 文件缺失：${report.storage.restorePlan.missingFiles.length ? report.storage.restorePlan.missingFiles.join(", ") : "无"}`,
    formatIssues("阻断项", report.blockers),
    formatIssues("提示", report.warnings),
    "下一步：",
    ...report.nextActions.map((action) => `- ${action}`),
  ].filter(Boolean).join("\n");
}

export function formatBackupRehearsalMarkdown(report: BackupRehearsalReport): string {
  return [
    "# Lexos 备份恢复演练报告",
    "",
    `- 演练 ID：${report.rehearsalId}`,
    `- 生成时间：${report.generatedAt}`,
    `- 结果：${report.ok ? "通过" : "未通过"}`,
    "",
    "## 数据库备份",
    "",
    `- 目录：${report.database.backupDir || "未配置"}`,
    `- Manifest：${report.database.manifest?.backupId ?? "未读取"}`,
    `- 缺失文件：${report.database.restorePlan.missingFiles.length ? report.database.restorePlan.missingFiles.join(", ") : "无"}`,
    "",
    "## Storage 备份",
    "",
    `- 目录：${report.storage.backupDir || "未配置"}`,
    `- Manifest：${report.storage.manifest?.backupId ?? "未读取"}`,
    `- 对象数量：${report.storage.manifest?.objectCount ?? 0}`,
    `- 缺失文件：${report.storage.restorePlan.missingFiles.length ? report.storage.restorePlan.missingFiles.join(", ") : "无"}`,
    "",
    "## 阻断项",
    "",
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ["- 无"]),
    "",
    "## 提示",
    "",
    ...report.warnings.map((warning) => `- ${warning}`),
    "",
    "## 下一步",
    "",
    ...report.nextActions.map((action) => `- ${action}`),
    "",
  ].join("\n");
}

export function isDatabaseBackupManifest(value: unknown): value is DatabaseBackupManifest {
  return isRecord(value) && value.app === "lexos" && value.kind === "postgres-logical-backup";
}

export function isStorageBackupManifest(value: unknown): value is StorageBackupManifest {
  return isRecord(value) && value.app === "lexos" && value.kind === "supabase-storage-backup";
}

export function compareManifestCreatedAt(left: { createdAt: string }, right: { createdAt: string }): number {
  return Date.parse(right.createdAt) - Date.parse(left.createdAt);
}

export function getDatabaseManifestPath(backupDir: string): string {
  return path.join(backupDir, DATABASE_BACKUP_MANIFEST_FILE);
}

export function getStorageManifestPath(backupDir: string): string {
  return path.join(backupDir, STORAGE_BACKUP_MANIFEST_FILE);
}

function buildWindowsTaskCommand(
  taskName: string,
  cadence: "DAILY" | "WEEKLY",
  startTime: string,
  projectRoot: string,
  commands: string[],
): string {
  const escapedProjectRoot = escapeWindowsScheduledTaskArgument(projectRoot);
  const escapedTaskName = escapeWindowsScheduledTaskArgument(taskName);
  const body = `cd /d ""${escapedProjectRoot}"" && ${commands.join(" && ")}`;

  return `schtasks /Create /TN "${escapedTaskName}" /SC ${cadence} /ST ${startTime} /TR "cmd.exe /d /s /c ""${body}"""`;
}

function escapeWindowsScheduledTaskArgument(value: string): string {
  return value.replaceAll("\"", "\"\"");
}

function buildCronEntry(dailyTime: BackupDailyTime, dayPattern: string, projectRoot: string, commands: string[]): string {
  return `${dailyTime.minute} ${dailyTime.hour} ${dayPattern} cd "${projectRoot}" && ${commands.join(" && ")}`;
}

function buildRehearsalNextActions(ok: boolean): string[] {
  if (!ok) {
    return [
      "补齐缺失的数据库或 Storage 备份文件后重新生成演练报告。",
      "确认数据库备份与 Storage 对象备份来自同一业务时间窗口。",
    ];
  }

  return [
    "在隔离验收环境执行真实恢复，并运行 npm run verify:rls。",
    "在允许写入的验收库执行 npm run smoke:real。",
    "人工核对客户大屏、任务附件下载、审计日志和结算页面。",
    "将本报告与备份目录、应用版本和执行人记录一起归档。",
  ];
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function formatIssues(title: string, issues: string[]): string {
  if (!issues.length) {
    return "";
  }

  return [
    `${title}：`,
    ...issues.map((issue) => `- ${issue}`),
  ].join("\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
