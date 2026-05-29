import { describe, expect, it } from "vitest";
import { buildAdminUsersQueryString } from "./admin-users-api.js";

describe("buildAdminUsersQueryString", () => {
  it("builds query string for list params", () => {
    expect(
      buildAdminUsersQueryString({ limit: "50", role: "lawyer", q: "zhang" }),
    ).toBe("?limit=50&role=lawyer&q=zhang");
  });
});
