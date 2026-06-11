import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { auditLogsToCsv, buildAuditLogInsert } from "../src/lib/audit/log.ts";

describe("审计日志", () => {
  it("构造统一的 audit_logs 入库记录", () => {
    const row = buildAuditLogInsert({
      organizationId: "org-id",
      actorUserId: "user-id",
      action: "tasks.claim",
      entityType: "tasks",
      entityId: "task-id",
      metadata: { rankId: "rank-id" },
      ipAddress: "127.0.0.1",
      userAgent: "node-test",
    });

    assert.deepEqual(row, {
      organization_id: "org-id",
      actor_user_id: "user-id",
      action: "tasks.claim",
      entity_type: "tasks",
      entity_id: "task-id",
      metadata: { rankId: "rank-id" },
      ip_address: "127.0.0.1",
      user_agent: "node-test",
    });
  });

  it("导出 CSV 时转义逗号、引号和换行", () => {
    const csv = auditLogsToCsv([
      {
        action: "auth.login_failed",
        actorDisplayName: "张律师",
        actorUsername: "lawyer01",
        createdAt: "2026-06-07T10:00:00.000Z",
        entityId: "user-id",
        entityType: "auth",
        ipAddress: "127.0.0.1",
        metadata: { reason: "invalid_credentials", note: "包含,逗号\"和换行\n" },
        userAgent: "node-test",
      },
    ]);

    assert.equal(
      csv,
      '时间,操作人,用户名,动作,对象类型,对象ID,IP,User-Agent,元数据\n2026-06-07T10:00:00.000Z,张律师,lawyer01,auth.login_failed,auth,user-id,127.0.0.1,node-test,"{""reason"":""invalid_credentials"",""note"":""包含,逗号\\""和换行\\n""}"\n',
    );
  });
});
