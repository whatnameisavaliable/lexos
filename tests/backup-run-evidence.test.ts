import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildBackupRunEvidenceCheck,
  formatBackupRunEvidenceCheck,
  getBackupRunEvidenceConfigFromEnv,
} from "../src/lib/operations/backup-run-evidence.ts";

describe("备份任务运行证据核对", () => {
  it("证据引用、责任人和最近成功时间完整时通过", () => {
    const check = buildBackupRunEvidenceCheck({
      generatedAt: new Date("2026-06-10T10:00:00.000Z"),
      lastSuccessAt: "2026-06-10T02:30:00.000Z",
      logRef: "ops-log-20260610-backup",
      owner: "运维负责人",
      rehearsalRef: "rehearsal-20260610",
      taskExportRef: "task-export-20260610",
    });

    assert.equal(check.ok, true);
    assert.equal(check.blockers.length, 0);
    assert.equal(check.ageHours, 7.5);
    assert.equal(check.evidenceItems.some((item) => item.id === "last-success"), true);
    assert.match(formatBackupRunEvidenceCheck(check), /备份任务运行证据核对：通过/);
  });

  it("缺少必需证据或最近成功时间过旧时阻断", () => {
    const check = buildBackupRunEvidenceCheck({
      generatedAt: new Date("2026-06-10T10:00:00.000Z"),
      lastSuccessAt: "2026-06-07T02:30:00.000Z",
      maxAgeHours: 48,
    });

    assert.equal(check.ok, false);
    assert.equal(check.blockers.some((blocker) => blocker.includes("责任人")), true);
    assert.equal(check.blockers.some((blocker) => blocker.includes("计划任务导出")), true);
    assert.equal(check.blockers.some((blocker) => blocker.includes("运维日志引用")), true);
    assert.equal(check.blockers.some((blocker) => blocker.includes("超过 48 小时")), true);
  });

  it("拒绝非法时间、未来时间和疑似敏感引用", () => {
    const invalidTime = buildBackupRunEvidenceCheck({
      generatedAt: new Date("2026-06-10T10:00:00.000Z"),
      lastSuccessAt: "not-a-date",
      logRef: "ops-log",
      owner: "运维负责人",
      taskExportRef: "task-export",
    });
    const futureTime = buildBackupRunEvidenceCheck({
      generatedAt: new Date("2026-06-10T10:00:00.000Z"),
      lastSuccessAt: "2026-06-10T12:00:00.000Z",
      logRef: "ops-log",
      owner: "运维负责人",
      taskExportRef: "task-export",
    });
    const secretRef = buildBackupRunEvidenceCheck({
      generatedAt: new Date("2026-06-10T10:00:00.000Z"),
      lastSuccessAt: "2026-06-10T02:30:00.000Z",
      logRef: "ops-log-token-abc",
      owner: "运维负责人",
      taskExportRef: "task-export",
    });

    assert.equal(invalidTime.blockers.some((blocker) => blocker.includes("ISO 时间")), true);
    assert.equal(futureTime.blockers.some((blocker) => blocker.includes("不能晚于当前核对时间")), true);
    assert.equal(secretRef.blockers.some((blocker) => blocker.includes("密钥信息")), true);
  });

  it("从环境变量读取配置并保留默认最大间隔", () => {
    const config = getBackupRunEvidenceConfigFromEnv({
      NODE_ENV: "test",
      LEXOS_BACKUP_RUN_LAST_SUCCESS_AT: "2026-06-10T02:30:00.000Z",
      LEXOS_BACKUP_RUN_LOG_REF: "ops-log",
      LEXOS_BACKUP_RUN_OWNER: "运维负责人",
      LEXOS_BACKUP_RUN_REHEARSAL_REF: "rehearsal",
      LEXOS_BACKUP_RUN_TASK_EXPORT_REF: "task-export",
    });

    assert.deepEqual(config, {
      lastSuccessAt: "2026-06-10T02:30:00.000Z",
      logRef: "ops-log",
      maxAgeHours: 48,
      owner: "运维负责人",
      rehearsalRef: "rehearsal",
      taskExportRef: "task-export",
    });
  });
});
