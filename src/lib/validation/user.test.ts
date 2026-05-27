import { describe, expect, it } from "vitest";

import {
  parseCreatableRole,
  parsePassword,
  parseUsername,
} from "@/lib/validation/user";

describe("user validation", () => {
  it("parses creatable roles only", () => {
    expect(parseCreatableRole("lawyer")).toBe("lawyer");
    expect(parseCreatableRole("admin")).toBeNull();
  });

  it("rejects invalid usernames", () => {
    expect(parseUsername(" abc")).toBeNull();
    expect(parseUsername("ok_name")).toBeNull();
    expect(parseUsername("valid1")).toBe("valid1");
  });

  it("enforces password length", () => {
    expect(parsePassword("short")).toBeNull();
    expect(parsePassword("longenough")).toBe("longenough");
  });
});
