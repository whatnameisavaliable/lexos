import { describe, expect, it } from "vitest";
import { matchRoutePattern } from "./route-match.js";

describe("matchRoutePattern", () => {
  it("matches id param", () => {
    expect(
      matchRoutePattern("/api/admin/users/:id", "/api/admin/users/uuid-1"),
    ).toEqual({ id: "uuid-1" });
  });

  it("rejects extra segments", () => {
    expect(
      matchRoutePattern(
        "/api/admin/users/:id",
        "/api/admin/users/uuid-1/status",
      ),
    ).toBeNull();
  });
});
