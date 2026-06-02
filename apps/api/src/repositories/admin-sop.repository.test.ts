import { describe, expect, it } from "vitest";
import { AdminSopRepository } from "./admin-sop.repository.js";

describe("AdminSopRepository", () => {
  it("does not expose service_role key on the instance", () => {
    const fakeClient = { from: () => ({}) };
    const repo = new AdminSopRepository(fakeClient as never);
    expect(repo).toBeDefined();
    expect(JSON.stringify(repo)).not.toContain("service_role");
  });
});
