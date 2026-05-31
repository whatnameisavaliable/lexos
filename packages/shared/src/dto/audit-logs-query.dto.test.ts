import { describe, expect, it } from "vitest";
import { parseAuditLogsQuery } from "./audit-logs-query.dto.js";

describe("parseAuditLogsQuery", () => {
  it("defaults limit to 50", () => {
    const result = parseAuditLogsQuery({});
    expect(result.limit).toBe(50);
  });

  it("accepts filters and cursor", () => {
    const result = parseAuditLogsQuery({
      limit: "10",
      cursor: "abc",
      action: "auth.login_failure",
      actorId: "550e8400-e29b-41d4-a716-446655440000",
      targetType: "profile",
      from: "2026-01-01T00:00:00.000Z",
      to: "2026-12-31T23:59:59.999Z",
    });
    expect(result).toMatchObject({
      limit: 10,
      cursor: "abc",
      action: "auth.login_failure",
      targetType: "profile",
    });
  });

  it("rejects from after to", () => {
    expect(() =>
      parseAuditLogsQuery({
        from: "2026-12-01T00:00:00.000Z",
        to: "2026-01-01T00:00:00.000Z",
      }),
    ).toThrow();
  });
});
