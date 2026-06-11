import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildBackupEncryptionPlan,
  formatBackupEncryptionPlan,
  getBackupEncryptionConfigFromEnv,
  parseBackupEncryptionMethod,
} from "../src/lib/operations/backup-encryption.ts";

describe("备份离线加密核对", () => {
  it("默认生成可人工交接的加密核对计划", () => {
    const plan = buildBackupEncryptionPlan({
      generatedAt: new Date("2026-06-10T12:00:00.000Z"),
    });

    assert.equal(plan.blockers.length, 0);
    assert.equal(plan.method, "manual");
    assert.equal(plan.copyCount, 2);
    assert.equal(plan.checklist.some((item) => item.includes("SHA-256")), true);
    assert.match(formatBackupEncryptionPlan(plan), /备份离线加密核对/);
  });

  it("副本数量过少或归档目录可能公开时阻断", () => {
    const plan = buildBackupEncryptionPlan({
      copyCount: 1,
      encryptedArchiveDir: "public/backups",
    });

    assert.equal(plan.blockers.length, 2);
    assert.equal(plan.blockers.some((blocker) => blocker.includes("至少需要 2 份")), true);
    assert.equal(plan.blockers.some((blocker) => blocker.includes("不能位于 public")), true);
  });

  it("密钥标识疑似包含私钥或密钥值时阻断", () => {
    const plan = buildBackupEncryptionPlan({
      keyReference: "-----BEGIN " + "PRIVATE KEY-----",
    });

    assert.equal(plan.blockers.some((blocker) => blocker.includes("只能填写密钥标识")), true);
  });

  it("按环境变量生成配置并兼容未知加密方式", () => {
    const config = getBackupEncryptionConfigFromEnv({
      LEXOS_BACKUP_DIR: "backups",
      LEXOS_BACKUP_ENCRYPTED_COPY_COUNT: "3",
      LEXOS_BACKUP_ENCRYPTED_DIR: "vault/lexos",
      LEXOS_BACKUP_ENCRYPTION_KEY_REF: "ops-age-key-2026",
      LEXOS_BACKUP_ENCRYPTION_METHOD: "age",
      LEXOS_BACKUP_OFFSITE_COPY_REQUIRED: "false",
      NODE_ENV: "test",
    });

    assert.equal(config.method, "age");
    assert.equal(config.copyCount, 3);
    assert.equal(config.offsiteCopyRequired, false);
    assert.equal(parseBackupEncryptionMethod("unknown"), "manual");
  });

  it("为 age、gpg 和 7z 输出对应命令示例", () => {
    assert.match(formatBackupEncryptionPlan(buildBackupEncryptionPlan({ method: "age", keyReference: "age1example" })), /age --recipient/);
    assert.match(formatBackupEncryptionPlan(buildBackupEncryptionPlan({ method: "gpg", keyReference: "ops@example.com" })), /gpg --encrypt/);
    assert.match(formatBackupEncryptionPlan(buildBackupEncryptionPlan({ method: "7z" })), /7z a -t7z/);
  });
});
