import { describe, expect, it, vi } from "vitest";
import { handleSopsRoute } from "../routes/sops.routes.js";

describe("sops route mount", () => {
  it("handleSopsRoute handles GET /api/sops/templates", async () => {
    const templatesList = { handle: vi.fn().mockResolvedValue(undefined) };
    const noop = { handle: vi.fn() };
    const handled = await handleSopsRoute(
      { method: "GET" } as never,
      {} as never,
      "/api/sops/templates",
      {
        templatesList: templatesList as never,
        uploadsInit: noop as never,
        uploadsComplete: noop as never,
        pipelinesCreate: noop as never,
        pipelinesStatus: noop as never,
        pipelinesResume: noop as never,
        pipelinesClose: noop as never,
        stepExecute: noop as never,
        stepFinalize: noop as never,
        artifactGet: noop as never,
        artifactPatch: noop as never,
        artifactVerify: noop as never,
        artifactRegeneratePdf: noop as never,
      },
    );
    expect(handled).toBe(true);
    expect(templatesList.handle).toHaveBeenCalled();
  });
});
