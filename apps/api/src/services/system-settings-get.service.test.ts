import { describe, expect, it, vi } from "vitest";
import { ErrorCode } from "@lexos/shared/api";
import { SystemSettingsGetService } from "./system-settings-get.service.js";

describe("SystemSettingsGetService", () => {
  it("returns setting when found", async () => {
    const repo = {
      get: vi.fn(async () => ({
        key: "retention.days",
        value: { days: 365 },
        updatedBy: "a1",
        updatedAt: "2026-05-31T00:00:00.000Z",
      })),
    };
    const service = new SystemSettingsGetService(repo as never);
    const item = await service.get("token", "retention.days");
    expect(item.key).toBe("retention.days");
  });

  it("throws when missing", async () => {
    const repo = { get: vi.fn(async () => null) };
    const service = new SystemSettingsGetService(repo as never);
    await expect(service.get("token", "missing")).rejects.toMatchObject({
      code: ErrorCode.RESOURCE_NOT_FOUND,
    });
  });
});
