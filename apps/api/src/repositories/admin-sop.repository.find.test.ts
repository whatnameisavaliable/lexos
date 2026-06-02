import { describe, expect, it, vi } from "vitest";
import { AdminSopRepository } from "./admin-sop.repository.js";

describe("AdminSopRepository.findTemplateVersionById", () => {
  it("returns null when version missing", async () => {
    const from = vi.fn(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }));

    const repo = new AdminSopRepository({ from } as never);
    const result = await repo.findTemplateVersionById("missing");
    expect(result).toBeNull();
  });
});
