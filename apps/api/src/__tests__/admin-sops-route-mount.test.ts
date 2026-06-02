import { describe, expect, it, vi } from "vitest";
import { handleAdminSopsRoute } from "../routes/admin-sops.routes.js";

describe("admin SOP route mount", () => {
  it("handleAdminSopsRoute handles GET /api/admin/sops", async () => {
    const list = { handle: vi.fn().mockResolvedValue(undefined) };
    const noop = { handle: vi.fn() };
    const handled = await handleAdminSopsRoute(
      { method: "GET" } as never,
      {} as never,
      "/api/admin/sops",
      {
        list,
        templateCreate: noop,
        templateGet: noop,
        versionGet: noop,
        versionPromptsUpsert: noop,
        versionCreate: noop,
        versionPublish: noop,
        previewPipeline: noop,
      },
    );
    expect(handled).toBe(true);
    expect(list.handle).toHaveBeenCalled();
  });
});
