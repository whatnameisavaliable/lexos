import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildBackupAlertPlan,
  formatBackupAlertPlan,
  getBackupAlertConfigFromEnv,
  parseBackupAlertChannels,
} from "../src/lib/operations/backup-alerts.ts";

describe("备份失败告警核对", () => {
  it("指定责任人且包含运维日志渠道时通过", () => {
    const plan = buildBackupAlertPlan({
      channels: ["operations-log", "email-manual"],
      generatedAt: new Date("2026-06-10T12:00:00.000Z"),
      owner: "律所运维负责人",
    });

    assert.equal(plan.blockers.length, 0);
    assert.equal(plan.rules.some((rule) => rule.id === "database-backup-failed"), true);
    assert.match(formatBackupAlertPlan(plan), /备份失败告警核对/);
  });

  it("缺少责任人、运维日志渠道或阈值不合规时阻断", () => {
    const plan = buildBackupAlertPlan({
      channels: ["email-manual"],
      escalationHours: 48,
      maxSilenceHours: 6,
    });

    assert.equal(plan.blockers.length, 4);
    assert.equal(plan.blockers.some((blocker) => blocker.includes("责任人")), true);
    assert.equal(plan.blockers.some((blocker) => blocker.includes("operations-log")), true);
  });

  it("从环境变量解析渠道并忽略未知渠道", () => {
    const config = getBackupAlertConfigFromEnv({
      LEXOS_BACKUP_ALERT_CHANNELS: "operations-log,email-manual,unknown",
      LEXOS_BACKUP_ALERT_ESCALATION_HOURS: "6",
      LEXOS_BACKUP_ALERT_MAX_SILENCE_HOURS: "36",
      LEXOS_BACKUP_ALERT_OWNER: "ops",
      NODE_ENV: "test",
    });

    assert.deepEqual(config.channels, ["operations-log", "email-manual"]);
    assert.equal(config.escalationHours, 6);
    assert.equal(config.maxSilenceHours, 36);
    assert.deepEqual(parseBackupAlertChannels("unknown"), ["operations-log"]);
  });

  it("格式化输出包含备份、演练、加密和静默超时规则", () => {
    const markdown = formatBackupAlertPlan(buildBackupAlertPlan({
      channels: ["operations-log", "webhook-manual"],
      owner: "ops",
    }));

    assert.match(markdown, /数据库备份失败/);
    assert.match(markdown, /Storage 对象备份失败/);
    assert.match(markdown, /离线加密副本缺失/);
    assert.match(markdown, /备份静默超时/);
    assert.match(markdown, /不发短信/);
  });
});
