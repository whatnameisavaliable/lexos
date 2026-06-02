import { describe, expect, it, vi } from "vitest";
import { AdminSopRepository } from "./admin-sop.repository.js";

describe("AdminSopRepository.copyVersionToNewDraft", () => {
  it("throws when source version is missing", async () => {
    vi.spyOn(AdminSopRepository.prototype, "findTemplateVersionById").mockResolvedValue(
      null,
    );

    const repo = new AdminSopRepository({ from: vi.fn() } as never);
    await expect(
      repo.copyVersionToNewDraft("t1", "missing", "admin"),
    ).rejects.toThrow("Source version not found");

    vi.restoreAllMocks();
  });
});
