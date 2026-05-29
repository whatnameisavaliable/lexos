import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
  adminUserCreateNormalizedUsername,
  parseAdminUserCreateBody,
} from "./admin-user-create.dto.js";

describe("adminUserCreateBodySchema", () => {
  it("accepts minimal create payload", () => {
    const body = parseAdminUserCreateBody({
      username: "Lawyer_Tom",
      displayName: "张三",
      role: "lawyer",
    });

    expect(body.username).toBe("lawyer_tom");
    expect(adminUserCreateNormalizedUsername(body)).toBe("lawyer_tom");
    expect(body.displayName).toBe("张三");
    expect(body.role).toBe("lawyer");
    expect(body.contact).toBeUndefined();
  });

  it("accepts optional contact", () => {
    const body = parseAdminUserCreateBody({
      username: "admin2",
      displayName: "管理员",
      role: "admin",
      contact: "13800000000",
    });

    expect(body.contact).toBe("13800000000");
  });

  it("rejects invalid username characters", () => {
    expect(() =>
      parseAdminUserCreateBody({
        username: "bad-name",
        displayName: "x",
        role: "lawyer",
      }),
    ).toThrow(ZodError);
  });

  it("rejects invalid role", () => {
    expect(() =>
      parseAdminUserCreateBody({
        username: "user1",
        displayName: "x",
        role: "superuser",
      }),
    ).toThrow(ZodError);
  });

  it("rejects empty displayName", () => {
    expect(() =>
      parseAdminUserCreateBody({
        username: "user1",
        displayName: "   ",
        role: "lawyer",
      }),
    ).toThrow(ZodError);
  });
});
