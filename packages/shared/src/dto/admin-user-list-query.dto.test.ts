import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseAdminUserListQuery } from "./admin-user-list-query.dto.js";

describe("adminUserListQuerySchema", () => {
  it("defaults limit to 50", () => {
    const query = parseAdminUserListQuery({});
    expect(query.limit).toBe(50);
  });

  it("clamps limit to max 50", () => {
    const query = parseAdminUserListQuery({ limit: "100" });
    expect(query.limit).toBe(50);
  });

  it("accepts filters and cursor", () => {
    const query = parseAdminUserListQuery({
      role: "lawyer",
      status: "enabled",
      q: "zhang",
      cursor: "2024-01-01T00:00:00.000Z|uuid",
    });
    expect(query.role).toBe("lawyer");
    expect(query.status).toBe("enabled");
    expect(query.q).toBe("zhang");
    expect(query.cursor).toBeDefined();
    expect(query.offset).toBeUndefined();
  });

  it("accepts offset mode", () => {
    const query = parseAdminUserListQuery({ offset: "10" });
    expect(query.offset).toBe(10);
  });

  it("rejects cursor and offset together", () => {
    expect(() =>
      parseAdminUserListQuery({ cursor: "c1", offset: 0 }),
    ).toThrow(ZodError);
  });
});
