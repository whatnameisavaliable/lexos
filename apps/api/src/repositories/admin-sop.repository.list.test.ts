import { describe, expect, it, vi } from "vitest";
import { AdminSopRepository } from "./admin-sop.repository.js";

function createListChain(finalResult: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "order", "or", "limit"] as const) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  Object.defineProperty(chain, "then", {
    value: (onFulfilled: (v: unknown) => unknown) =>
      Promise.resolve(finalResult).then(onFulfilled),
  });
  return chain;
}

describe("AdminSopRepository.listTemplatesWithVersions", () => {
  it("maps templates with nested versions", async () => {
    const chain = createListChain({
      data: [
        {
          id: "t1",
          name: "SOP",
          case_type: "civil",
          created_by: "admin",
          created_at: "2026-01-01T00:00:00.000Z",
          sop_template_versions: [
            {
              id: "v1",
              template_id: "t1",
              version_number: 1,
              is_published: true,
              published_at: "2026-01-02T00:00:00.000Z",
              created_by: "admin",
              created_at: "2026-01-01T00:00:00.000Z",
            },
          ],
        },
      ],
      error: null,
    });

    const from = vi.fn().mockReturnValue(chain);
    const repo = new AdminSopRepository({ from } as never);

    const result = await repo.listTemplatesWithVersions(50);
    expect(result.items[0]?.templateId).toBe("t1");
    expect(result.items[0]?.versions[0]?.versionNumber).toBe(1);
  });
});
