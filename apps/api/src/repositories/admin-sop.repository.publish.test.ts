import { describe, expect, it, vi } from "vitest";
import { AdminSopRepository } from "./admin-sop.repository.js";

describe("AdminSopRepository.publishVersion", () => {
  it("updates version as published", async () => {
    const eqPublished = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq: () => ({ eq: eqPublished }) });

    const from = vi.fn(() => ({
      update,
    }));

    const repo = new AdminSopRepository({ from } as never);
    await repo.publishVersion("v1", 1, "2026-06-02T00:00:00.000Z");

    expect(update).toHaveBeenCalledWith({
      is_published: true,
      version_number: 1,
      published_at: "2026-06-02T00:00:00.000Z",
    });
    expect(eqPublished).toHaveBeenCalledWith("is_published", false);
  });
});
