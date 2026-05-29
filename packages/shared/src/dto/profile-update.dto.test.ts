import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseProfileUpdateBody } from "./profile-update.dto.js";

describe("profileUpdateBodySchema", () => {
  it("accepts displayName only", () => {
    const body = parseProfileUpdateBody({ displayName: "张三" });
    expect(body.displayName).toBe("张三");
    expect(body.contact).toBeUndefined();
  });

  it("accepts contact clear with null", () => {
    const body = parseProfileUpdateBody({ contact: null });
    expect(body.contact).toBeNull();
  });

  it("accepts both fields", () => {
    const body = parseProfileUpdateBody({
      displayName: "李四",
      contact: "13800000000",
    });
    expect(body).toEqual({ displayName: "李四", contact: "13800000000" });
  });

  it("rejects empty patch", () => {
    expect(() => parseProfileUpdateBody({})).toThrow(ZodError);
  });

  it("rejects empty displayName string", () => {
    expect(() => parseProfileUpdateBody({ displayName: "   " })).toThrow(
      ZodError,
    );
  });
});
