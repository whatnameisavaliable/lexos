import { describe, expect, it, vi, afterEach } from "vitest";
import { ApiClientError } from "./api-client.js";
import { upsertAdminSopVersionPrompts } from "./admin-sops-api.js";
import { SopExecutionType } from "@lexos/shared";

describe("upsertAdminSopVersionPrompts", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("PUTs steps body on success", async () => {
    const versionId = "00000000-0000-4000-8000-000000000002";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            success: true,
            data: {
              versionId,
              templateId: "00000000-0000-4000-8000-000000000001",
              templateName: "模板",
              caseType: "civil",
              versionNumber: 1,
              isPublished: false,
              publishedAt: null,
              createdAt: "2026-01-01T00:00:00.000Z",
              steps: [],
            },
            meta: { requestId: "r1" },
          }),
      }),
    );

    const result = await upsertAdminSopVersionPrompts(versionId, {
      steps: [
        {
          stepCode: "fact",
          name: "事实提取",
          executionType: SopExecutionType.MANUAL,
          inputSchema: {},
          dependsOn: [],
          requiresVerification: false,
        },
      ],
    });
    expect(result.versionId).toBe(versionId);
  });

  it("throws ApiClientError on 422 published version", async () => {
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
              message: "Published template version is read-only",
              requestId: "r2",
            },
          }),
      }),
    );

    await expect(
      upsertAdminSopVersionPrompts("v1", {
        steps: [
          {
            stepCode: "fact",
            name: "事实",
            executionType: SopExecutionType.MANUAL,
            inputSchema: {},
            dependsOn: [],
            requiresVerification: false,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ApiClientError);
  });
});
