import { describe, expect, it, vi } from "vitest";
import { ErrorCode } from "@lexos/shared/api";
import { SystemSettingsUpsertService } from "./system-settings-upsert.service.js";

describe("SystemSettingsUpsertService", () => {
  it("upserts allowed key", async () => {
    const repo = {
      upsert: vi.fn(async () => ({
        key: "retention.days",
        value: { days: 30 },
        updatedBy: "admin-1",
        updatedAt: "2026-05-31T00:00:00.000Z",
      })),
    };
    const service = new SystemSettingsUpsertService(repo as never);
    const item = await service.upsert("token", "admin-1", "retention.days", {
      value: { days: 30 },
    });
    expect(item.value).toEqual({ days: 30 });
    expect(repo.upsert).toHaveBeenCalledWith(
      "token",
      "retention.days",
      { days: 30 },
      "admin-1",
    );
  });

  it("rejects forbidden key patterns", async () => {
    const repo = { upsert: vi.fn() };
    const service = new SystemSettingsUpsertService(repo as never);
    await expect(
      service.upsert("token", "admin-1", "external.api_key", { value: {} }),
    ).rejects.toMatchObject({ code: ErrorCode.VALIDATION_FAILED });
    expect(repo.upsert).not.toHaveBeenCalled();
  });
});
