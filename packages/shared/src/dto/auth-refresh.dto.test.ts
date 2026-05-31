import { describe, expect, it } from "vitest";
import { parseAuthRefreshBody } from "./auth-refresh.dto.js";

describe("parseAuthRefreshBody", () => {
  it("accepts refresh token", () => {
    const body = parseAuthRefreshBody({ refreshToken: "rt-abc" });
    expect(body.refreshToken).toBe("rt-abc");
  });

  it("rejects empty refresh token", () => {
    expect(() => parseAuthRefreshBody({ refreshToken: "" })).toThrow();
  });
});
