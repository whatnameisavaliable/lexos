import { describe, expect, it, vi } from "vitest";
import { AdminSopListService } from "./admin-sop-list.service.js";

describe("AdminSopListService", () => {
  it("returns paginated list", async () => {
    const repository = {
      listTemplatesWithVersions: vi.fn().mockResolvedValue({
        items: [],
        nextCursor: undefined,
      }),
    };
    const service = new AdminSopListService(repository as never);
    const result = await service.list({ limit: 50 });
    expect(result.meta.limit).toBe(50);
  });
});
