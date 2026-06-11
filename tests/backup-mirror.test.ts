import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildBackupMirrorPlan,
  formatBackupMirrorPlan,
  getBackupMirrorConfigFromEnv,
  parseBackupMirrorTarget,
} from "../src/lib/operations/backup-mirror.ts";

describe("备份异地镜像核对", () => {
  it("指定责任人和目的地标识时通过", () => {
    const plan = buildBackupMirrorPlan({
      destinationRef: "offsite-vault-01",
      generatedAt: new Date("2026-06-10T12:30:00.000Z"),
      owner: "律所运维负责人",
      target: "offline-disk",
    });

    assert.equal(plan.blockers.length, 0);
    assert.equal(plan.rules.some((rule) => rule.id === "encrypted-before-mirror"), true);
    assert.match(formatBackupMirrorPlan(plan), /备份异地\/跨云镜像核对/);
  });

  it("缺少责任人、目的地或镜像策略不合规时阻断", () => {
    const plan = buildBackupMirrorPlan({
      destinationRef: "secret-token-value",
      minCopies: 1,
      rpoHours: 72,
      verifyIntervalDays: 120,
    });

    assert.equal(plan.blockers.length, 5);
    assert.equal(plan.blockers.some((blocker) => blocker.includes("责任人")), true);
    assert.equal(plan.blockers.some((blocker) => blocker.includes("不能包含 token")), true);
    assert.equal(plan.blockers.some((blocker) => blocker.includes("RPO")), true);
  });

  it("从环境变量解析目标、目的地和周期", () => {
    const config = getBackupMirrorConfigFromEnv({
      LEXOS_BACKUP_MIRROR_DESTINATION_REF: "cross-cloud-bucket-a",
      LEXOS_BACKUP_MIRROR_MIN_COPIES: "3",
      LEXOS_BACKUP_MIRROR_OWNER: "ops",
      LEXOS_BACKUP_MIRROR_RPO_HOURS: "12",
      LEXOS_BACKUP_MIRROR_TARGET: "s3-compatible",
      LEXOS_BACKUP_MIRROR_VERIFY_INTERVAL_DAYS: "45",
      NODE_ENV: "test",
    });

    assert.equal(config.target, "s3-compatible");
    assert.equal(config.destinationRef, "cross-cloud-bucket-a");
    assert.equal(config.minCopies, 3);
    assert.equal(config.rpoHours, 12);
    assert.equal(config.verifyIntervalDays, 45);
    assert.equal(parseBackupMirrorTarget("unknown"), "manual-offsite");
  });

  it("格式化输出包含加密、manifest、抽检和不连接线上边界", () => {
    const markdown = formatBackupMirrorPlan(buildBackupMirrorPlan({
      destinationRef: "vault-a",
      owner: "ops",
      target: "manual-offsite",
    }));

    assert.match(markdown, /离线加密/);
    assert.match(markdown, /manifest/);
    assert.match(markdown, /恢复抽检/);
    assert.match(markdown, /不连接线上 Supabase/);
  });
});
