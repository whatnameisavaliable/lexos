import { describe, expect, it } from "vitest";
import {
  isReservedUserRole,
  RESERVED_USER_ROLES,
  UserRole,
} from "./user-role.js";

describe("user-role", () => {
  it("identifies reserved roles", () => {
    expect(RESERVED_USER_ROLES).toEqual(["director", "client", "channel"]);
    expect(isReservedUserRole(UserRole.DIRECTOR)).toBe(true);
    expect(isReservedUserRole(UserRole.LAWYER)).toBe(false);
    expect(isReservedUserRole(UserRole.ADMIN)).toBe(false);
  });
});
