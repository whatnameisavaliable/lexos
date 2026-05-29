import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseAdminUserStatusBody } from "./admin-user-status.dto.js";

describe("adminUserStatusBodySchema", () => {
  it("accepts enabled", () => {
    expect(parseAdminUserStatusBody({ status: "enabled" }).status).toBe(
      "enabled",
    );
  });

  it("accepts disabled", () => {
    expect(parseAdminUserStatusBody({ status: "disabled" }).status).toBe(
      "disabled",
    );
  });

  it("rejects invalid status", () => {
    expect(() => parseAdminUserStatusBody({ status: "deleted" })).toThrow(
      ZodError,
    );
  });
});
