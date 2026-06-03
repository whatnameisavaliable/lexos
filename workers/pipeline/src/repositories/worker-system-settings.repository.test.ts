import { describe, expect, it, vi } from "vitest";
import { SOP_DEEP_RESEARCH_ENABLED_KEY } from "@lexos/shared";
import { WorkerSystemSettingsRepository } from "./worker-system-settings.repository.js";

describe("WorkerSystemSettingsRepository.isDeepResearchEnabled", () => {
  const repo = new WorkerSystemSettingsRepository();

  it("defaults to true when setting row is missing", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    };

    const enabled = await repo.isDeepResearchEnabled(client as never);
    expect(enabled).toBe(true);
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("system_settings"),
      [SOP_DEEP_RESEARCH_ENABLED_KEY],
    );
  });

  it("reads boolean jsonb value", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [{ value: false }] }),
    };

    await expect(repo.isDeepResearchEnabled(client as never)).resolves.toBe(
      false,
    );
  });

  it("reads { enabled } object value", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [{ value: { enabled: false } }] }),
    };

    await expect(repo.isDeepResearchEnabled(client as never)).resolves.toBe(
      false,
    );
  });

  it("defaults to true when value is null", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [{ value: null }] }),
    };

    await expect(repo.isDeepResearchEnabled(client as never)).resolves.toBe(
      true,
    );
  });
});
