import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildDatabaseBackupPlan,
  buildDatabaseRestorePlan,
  DATABASE_RESTORE_CONFIRMATION,
  getDatabaseUrlFromEnv,
  parseBackupSchemas,
  redactDatabaseUrl,
} from "../src/lib/operations/database-backup.ts";

const databaseUrl = "postgresql://postgres" + ":secret-password@db.example.supabase.co:5432/postgres";

describe("数据库备份计划", () => {
  it("从环境变量读取数据库连接串，优先使用 Lexos 专用变量", () => {
    assert.equal(getDatabaseUrlFromEnv({
      DATABASE_URL: "postgresql://fallback",
      LEXOS_DATABASE_URL: "postgresql://lexos",
    } as unknown as NodeJS.ProcessEnv), "postgresql://lexos");
  });

  it("展示命令和 manifest 时会打码数据库账号密码", () => {
    const plan = buildDatabaseBackupPlan({
      backupId: "lexos-db-test",
      databaseUrl,
      dryRun: true,
      schemas: ["public", "auth", "storage"],
    });

    assert.equal(plan.ok, true);
    assert.equal(plan.redactedDatabaseUrl.includes("secret-password"), false);
    assert.equal(plan.commands.every((command) => !command.display.includes("secret-password")), true);
    assert.equal(plan.manifest.source.databaseUrl.includes("***"), true);
  });

  it("非演练模式缺少数据库连接串时阻断执行", () => {
    const plan = buildDatabaseBackupPlan({
      backupId: "lexos-db-test",
      databaseUrl: "",
      dryRun: false,
      schemas: ["public"],
    });

    assert.equal(plan.ok, false);
    assert.equal(plan.blockers.some((blocker) => blocker.includes("缺少数据库连接串")), true);
  });

  it("演练模式可以在没有连接串时输出命令计划", () => {
    const plan = buildDatabaseBackupPlan({
      backupId: "lexos-db-test",
      databaseUrl: "",
      dryRun: true,
      schemas: ["public"],
    });

    assert.equal(plan.ok, true);
    assert.equal(plan.commands[0].args.includes("--dry-run"), true);
  });

  it("清理备份 schema 并去重非法值", () => {
    assert.deepEqual(parseBackupSchemas("public,auth,public,bad-name,storage"), [
      "public",
      "auth",
      "storage",
    ]);
  });
});

describe("数据库恢复计划", () => {
  it("默认恢复计划只做演练，不要求确认口令", () => {
    const plan = buildDatabaseRestorePlan({
      backupDir: "backups/lexos-db-test",
      databaseUrl,
      existingFiles: ["manifest.json", "schema.sql", "data.sql", "roles.sql"],
    });

    assert.equal(plan.ok, true);
    assert.equal(plan.dryRun, true);
    assert.equal(plan.commands.length, 2);
  });

  it("执行恢复时必须设置确认口令", () => {
    const plan = buildDatabaseRestorePlan({
      backupDir: "backups/lexos-db-test",
      databaseUrl,
      executeRequested: true,
      existingFiles: ["manifest.json", "schema.sql", "data.sql"],
    });

    assert.equal(plan.ok, false);
    assert.equal(plan.blockers.some((blocker) => blocker.includes(DATABASE_RESTORE_CONFIRMATION)), true);
  });

  it("执行恢复时可选择追加 roles.sql", () => {
    const plan = buildDatabaseRestorePlan({
      applyRoles: true,
      backupDir: "backups/lexos-db-test",
      confirmation: DATABASE_RESTORE_CONFIRMATION,
      databaseUrl,
      executeRequested: true,
      existingFiles: ["manifest.json", "schema.sql", "data.sql", "roles.sql"],
    });

    assert.equal(plan.ok, true);
    assert.equal(plan.dryRun, false);
    assert.equal(plan.commands.map((command) => command.label).join(","), "roles,schema,data");
  });

  it("缺少 manifest、schema 或 data 时阻断恢复", () => {
    const plan = buildDatabaseRestorePlan({
      backupDir: "backups/lexos-db-test",
      databaseUrl,
      existingFiles: ["schema.sql"],
    });

    assert.equal(plan.ok, false);
    assert.deepEqual(plan.missingFiles, ["manifest.json", "data.sql"]);
  });

  it("无法解析的连接串不会原样回显", () => {
    assert.equal(redactDatabaseUrl("not-a-url"), "[无法解析的数据库连接串]");
  });
});
