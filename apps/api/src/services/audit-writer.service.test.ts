import { describe, expect, it, vi } from "vitest";
import { AuditWriterService } from "./audit-writer.service.js";

describe("AuditWriterService", () => {
  const auditLogRepository = { append: vi.fn() };
  const service = new AuditWriterService(auditLogRepository as never);

  it("merges client_timestamp into metadata for browser events", async () => {
    auditLogRepository.append.mockResolvedValue("audit-1");

    await service.write(
      {
        actorId: "u1",
        action: "auth.login_success",
        targetType: "profile",
        targetId: "u1",
      },
      {
        ip: "127.0.0.1",
        userAgent: "TestAgent/1.0",
        client: {
          clientTimestamp: "2026-05-31T03:00:00.000Z",
          clientTimezone: "Asia/Shanghai",
        },
      },
    );

    expect(auditLogRepository.append).toHaveBeenCalledWith({
      actorId: "u1",
      action: "auth.login_success",
      targetType: "profile",
      targetId: "u1",
      ip: "127.0.0.1",
      userAgent: "TestAgent/1.0",
      metadata: {
        client_timestamp: "2026-05-31T03:00:00.000Z",
        client_timezone: "Asia/Shanghai",
      },
    });
  });

});
