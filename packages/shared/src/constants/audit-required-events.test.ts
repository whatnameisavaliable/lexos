import { describe, expect, it } from "vitest";
import {
  AUDIT_ACTION_VALUES,
  isAuditAction,
} from "./audit-required-events.js";

describe("audit-required-events", () => {
  it("lists 18 audit_action values aligned with database.md", () => {
    expect(AUDIT_ACTION_VALUES).toHaveLength(18);
    expect(AUDIT_ACTION_VALUES).toContain("task.fail");
    expect(AUDIT_ACTION_VALUES).toContain("file.export");
  });

  it("isAuditAction narrows valid actions", () => {
    expect(isAuditAction("auth.login_success")).toBe(true);
    expect(isAuditAction("invalid.action")).toBe(false);
  });
});
