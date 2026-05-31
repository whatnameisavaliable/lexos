import { describe, expect, it, vi } from "vitest";
import { SystemSettingsListService } from "./system-settings-list.service.js";

describe("SystemSettingsListService", () => {
  it("returns all settings", async () => {
    const repo = {
      list: vi.fn(async () => [
        {
          key: "retention.days",
          value: { days: 365 },
          updatedBy: "admin-1",
          updatedAt: "2026-05-31T00:00:00.000Z",
        },
      ]),
    };
    const service = new SystemSettingsListService(repo as never);
    const result = await service.list("token");
    expect(result.items).toHaveLength(1);
  });
});
