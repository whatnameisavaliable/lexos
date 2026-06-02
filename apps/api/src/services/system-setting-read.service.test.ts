import { describe, expect, it, vi } from "vitest";
import { SystemSettingReadService } from "./system-setting-read.service.js";

describe("SystemSettingReadService", () => {
  it("returns false when setting is disabled", async () => {
    const repo = {
      getValue: vi.fn(async () => ({ enabled: false })),
    };
    const service = new SystemSettingReadService(repo as never);
    expect(await service.isDeepResearchEnabled()).toBe(false);
  });

  it("defaults to true when missing", async () => {
    const repo = { getValue: vi.fn(async () => null) };
    const service = new SystemSettingReadService(repo as never);
    expect(await service.isDeepResearchEnabled()).toBe(true);
  });
});
