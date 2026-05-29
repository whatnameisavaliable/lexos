import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseAdminUserUpdateBody } from "./admin-user-update.dto.js";

describe("adminUserUpdateBodySchema", () => {
  it("accepts displayName only", () => {
    const body = parseAdminUserUpdateBody({ displayName: "李四" });
    expect(body.displayName).toBe("李四");
  });

  it("accepts role and nullable contact", () => {
    const body = parseAdminUserUpdateBody({
      role: "director",
      contact: null,
    });
    expect(body.role).toBe("director");
    expect(body.contact).toBeNull();
  });

  it("rejects empty patch", () => {
    expect(() => parseAdminUserUpdateBody({})).toThrow(ZodError);
  });

  it("rejects status in body", () => {
    expect(() =>
      parseAdminUserUpdateBody({ status: "disabled", displayName: "x" }),
    ).toThrow(ZodError);
  });

  it("rejects username in body", () => {
    expect(() =>
      parseAdminUserUpdateBody({ username: "new_name", displayName: "x" }),
    ).toThrow(ZodError);
  });
});
