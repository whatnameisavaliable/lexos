import { describe, expect, it, vi, afterEach } from "vitest";
import { ApiClientError } from "./api-client.js";
import { createSopPipeline } from "./lawyer-sops-api.js";

describe("createSopPipeline", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs templateVersionId on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          success: true,
          data: {
            id: "00000000-0000-4000-8000-000000000003",
            lawyerId: "00000000-0000-4000-8000-000000000004",
            templateVersionId: "00000000-0000-4000-8000-000000000002",
            status: "in_progress",
            currentStepCode: null,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
          meta: { requestId: "r1" },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createSopPipeline({
      templateVersionId: "00000000-0000-4000-8000-000000000002",
    });
    expect(result.id).toBe("00000000-0000-4000-8000-000000000003");
  });

  it("throws ApiClientError on 422 unpublished version", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        text: async () =>
          JSON.stringify({
            success: false,
            error: {
              code: "OPERATION_NOT_ALLOWED",
              message: "Template version is not published",
              requestId: "r2",
            },
          }),
      }),
    );

    await expect(
      createSopPipeline({
        templateVersionId: "00000000-0000-4000-8000-000000000002",
      }),
    ).rejects.toBeInstanceOf(ApiClientError);
  });
});
