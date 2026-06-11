import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildBackupTaskInstallationPlan,
  formatBackupTaskInstallationPlan,
  getBackupTaskInstallationConfigFromEnv,
  parseBackupTaskInstallationPlatform,
} from "../src/lib/operations/backup-task-installation.ts";
import { buildBackupSchedulePlan } from "../src/lib/operations/backup-operations.ts";

describe("备份系统任务安装核对", () => {
  it("生成只读安装核对清单和平台任务参考命令", () => {
    const schedule = buildBackupSchedulePlan({
      dailyTime: "02:45",
      projectRoot: "D:\\AI程序开发\\lexos",
      rehearsalIntervalDays: 30,
      retentionDays: 30,
    });
    const plan = buildBackupTaskInstallationPlan({
      generatedAt: new Date("2026-06-10T09:00:00.000Z"),
      logDir: "ops-logs/backups",
      owner: "运维负责人",
      platform: "windows",
      projectRoot: "D:\\AI程序开发\\lexos",
      runAsAccount: "lexos-backup-runner",
      schedule,
    });

    assert.equal(plan.blockers.length, 0);
    assert.equal(plan.kind, "lexos-backup-task-installation-plan");
    assert.equal(plan.steps.some((step) => step.id === "post-install"), true);
    assert.match(formatBackupTaskInstallationPlan(plan), /不会调用 schtasks/);
    assert.match(formatBackupTaskInstallationPlan(plan), /schtasks/);
  });

  it("缺少责任人、运行账号或日志目录不合规时阻断", () => {
    const plan = buildBackupTaskInstallationPlan({
      logDir: "public/backup-logs",
      owner: "未指定",
      runAsAccount: "未指定",
      schedule: buildBackupSchedulePlan({ retentionDays: 3 }),
    });

    assert.equal(plan.blockers.length >= 4, true);
    assert.equal(plan.blockers.some((blocker) => blocker.includes("责任人")), true);
    assert.equal(plan.blockers.some((blocker) => blocker.includes("运行账号")), true);
    assert.equal(plan.blockers.some((blocker) => blocker.includes("发布目录")), true);
    assert.equal(plan.blockers.some((blocker) => blocker.includes("保留天数")), true);
  });

  it("解析环境变量和平台取值", () => {
    assert.equal(parseBackupTaskInstallationPlatform("linux"), "linux");
    assert.equal(parseBackupTaskInstallationPlatform("WINDOWS"), "windows");
    assert.equal(parseBackupTaskInstallationPlatform("bad"), "both");

    const config = getBackupTaskInstallationConfigFromEnv({
      NODE_ENV: "test",
      LEXOS_BACKUP_TASK_LOG_DIR: "ops-logs/custom",
      LEXOS_BACKUP_TASK_OWNER: "交付负责人",
      LEXOS_BACKUP_TASK_PLATFORM: "linux",
      LEXOS_BACKUP_TASK_RUN_AS: "lexos-cron",
    });

    assert.deepEqual(config, {
      logDir: "ops-logs/custom",
      owner: "交付负责人",
      platform: "linux",
      runAsAccount: "lexos-cron",
    });
  });
});
