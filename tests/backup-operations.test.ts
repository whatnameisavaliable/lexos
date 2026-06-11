import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildBackupRehearsalReport,
  buildBackupSchedulePlan,
  formatBackupRehearsalMarkdown,
  formatBackupScheduleMarkdown,
  parseBackupDailyTime,
} from "../src/lib/operations/backup-operations.ts";
import type { DatabaseBackupManifest } from "../src/lib/operations/database-backup.ts";
import {
  buildStorageBackupObjectLocalPath,
  type StorageBackupManifest,
} from "../src/lib/operations/storage-backup.ts";

const databaseManifest: DatabaseBackupManifest = {
  app: "lexos",
  backupId: "lexos-db-test",
  createdAt: "2026-06-10T02:30:00.000Z",
  files: [
    { label: "schema", path: "schema.sql" },
    { label: "data", path: "data.sql" },
    { label: "roles", path: "roles.sql" },
  ],
  kind: "postgres-logical-backup",
  source: {
    databaseUrl: "postgresql://***" + ":***@db.example.supabase.co:5432/postgres",
    schemas: ["public", "auth", "storage"],
  },
  version: 1,
  warnings: [],
};

const storageLocalPath = buildStorageBackupObjectLocalPath("org/task/contract.pdf");
const storageManifest: StorageBackupManifest = {
  app: "lexos",
  backupId: "lexos-storage-test",
  createdAt: "2026-06-10T02:35:00.000Z",
  kind: "supabase-storage-backup",
  objectCount: 1,
  objects: [
    {
      bucket: "lexos-deliverables",
      localPath: storageLocalPath,
      path: "org/task/contract.pdf",
      size: 1024,
    },
  ],
  source: {
    bucket: "lexos-deliverables",
    supabaseUrl: "https://example.supabase.co",
  },
  totalBytes: 1024,
  version: 1,
  warnings: [],
};

describe("备份定时调度计划", () => {
  it("解析 HH:mm 备份时间，并拒绝非法时间", () => {
    assert.deepEqual(parseBackupDailyTime("02:30"), {
      hour: 2,
      minute: 30,
      value: "02:30",
    });
    assert.throws(() => parseBackupDailyTime("25:99"), /HH:mm/);
  });

  it("生成 Windows Task Scheduler 和 Linux cron 示例", () => {
    const plan = buildBackupSchedulePlan({
      dailyTime: "03:15",
      projectRoot: "D:\\AI程序开发\\lexos",
      retentionDays: 30,
    });

    assert.equal(plan.blockers.length, 0);
    assert.equal(plan.commands.dailyBackup.includes("npm.cmd run backup:db"), true);
    assert.equal(plan.commands.dailyBackup.includes("npm.cmd run backup:storage"), true);
    assert.match(plan.windowsTaskScheduler.dailyBackup, /schtasks/);
    assert.match(plan.windowsTaskScheduler.dailyBackup, /cmd\.exe \/d \/s \/c/);
    assert.match(plan.windowsTaskScheduler.dailyBackup, /""D:\\AI程序开发\\lexos""/);
    assert.match(plan.cronEntries.dailyBackup, /^15 3 \* \* \*/);
    assert.match(formatBackupScheduleMarkdown(plan), /Lexos 备份定时调度计划/);
  });

  it("保留期或演练间隔过短时阻断计划", () => {
    const plan = buildBackupSchedulePlan({
      rehearsalIntervalDays: 3,
      retentionDays: 3,
    });

    assert.equal(plan.blockers.length, 2);
    assert.equal(plan.blockers.some((blocker) => blocker.includes("保留天数")), true);
  });
});

describe("备份恢复演练报告", () => {
  it("数据库和 Storage 备份文件齐全时报告通过", () => {
    const report = buildBackupRehearsalReport({
      databaseBackupDir: "backups/lexos-db-test",
      databaseExistingFiles: ["manifest.json", "schema.sql", "data.sql", "roles.sql"],
      databaseManifest,
      generatedAt: new Date("2026-06-10T03:00:00.000Z"),
      rehearsalId: "lexos-rehearsal-test",
      storageBackupDir: "backups/lexos-storage-test",
      storageExistingFiles: ["storage-manifest.json", storageLocalPath],
      storageManifest,
    });

    assert.equal(report.ok, true);
    assert.equal(report.blockers.length, 0);
    assert.equal(report.nextActions.some((action) => action.includes("verify:rls")), true);
    assert.match(formatBackupRehearsalMarkdown(report), /恢复演练报告/);
  });

  it("缺少数据库或 Storage 文件时报告不通过并给出阻断项", () => {
    const report = buildBackupRehearsalReport({
      databaseBackupDir: "backups/lexos-db-test",
      databaseExistingFiles: ["manifest.json", "schema.sql"],
      databaseManifest,
      storageBackupDir: "backups/lexos-storage-test",
      storageExistingFiles: ["storage-manifest.json"],
      storageManifest,
    });

    assert.equal(report.ok, false);
    assert.equal(report.blockers.some((blocker) => blocker.includes("数据库")), true);
    assert.equal(report.blockers.some((blocker) => blocker.includes("Storage")), true);
    assert.equal(report.nextActions.some((action) => action.includes("补齐缺失")), true);
  });
});
