import { describe, expect, it, vi } from "vitest";
import { ErrorCode } from "@lexos/shared/api";
import { AuditLogGetService } from "./audit-log-get.service.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";

describe("AuditLogGetService", () => {
  it("returns mapped audit log", async () => {
    const repo = {
      getById: vi.fn(async () => ({
        id: "log-1",
        actor_id: "u1",
        action: "user.create",
        target_type: "profile",
        target_id: "u2",
        ip_address: "10.0.0.1",
        user_agent: "Agent",
        metadata: { client_timestamp: "2026-05-31T00:00:00.000Z" },
        row_hash: "hash",
        created_at: "2026-05-31T01:00:00.000Z",
      })),
    };
    const service = new AuditLogGetService(repo as never);
    const item = await service.get("admin-token", "log-1");
    expect(item.id).toBe("log-1");
    expect(item.metadata.clientTimestamp).toBe("2026-05-31T00:00:00.000Z");
  });

  it("throws RESOURCE_NOT_FOUND when row missing", async () => {
    const repo = { getById: vi.fn(async () => null) };
    const service = new AuditLogGetService(repo as never);
    await expect(service.get("admin-token", "missing")).rejects.toMatchObject({
      code: ErrorCode.RESOURCE_NOT_FOUND,
    } satisfies Partial<AppHttpError>);
  });
});
