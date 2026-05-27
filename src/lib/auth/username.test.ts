import { describe, expect, it } from "vitest";

import { isValidUsername, usernameToEmail } from "@/lib/auth/username";

describe("username helpers", () => {
  it("maps username to internal email", () => {
    expect(usernameToEmail("alice")).toBe("alice@lexos.internal");
    expect(usernameToEmail("Admin")).toBe("Admin@lexos.internal");
  });

  it("validates ascii alphanumeric usernames", () => {
    expect(isValidUsername("user123")).toBe(true);
    expect(isValidUsername("123")).toBe(true);
    expect(isValidUsername("user name")).toBe(false);
    expect(isValidUsername("用户")).toBe(false);
    expect(isValidUsername("user.name")).toBe(false);
  });
});
