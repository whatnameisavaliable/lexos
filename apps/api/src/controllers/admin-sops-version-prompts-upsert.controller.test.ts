import { describe, expect, it, vi } from "vitest";
import { ErrorCode } from "@lexos/shared/api";
import { LexosError } from "@lexos/shared";
import { AdminSopsVersionPromptsUpsertController } from "./admin-sops-version-prompts-upsert.controller.js";
import { runWithRequestContext } from "../middleware/request-context.js";

describe("AdminSopsVersionPromptsUpsertController", () => {
  it("returns 422 path when service throws OPERATION_NOT_ALLOWED", async () => {
    const service = {
      upsert: vi.fn().mockRejectedValue(
        new LexosError(ErrorCode.OPERATION_NOT_ALLOWED, "published"),
      ),
    };
    const controller = new AdminSopsVersionPromptsUpsertController(
      service as never,
      "x-request-id",
    );

    const req = {
      method: "PUT",
      headers: {},
      async *[Symbol.asyncIterator]() {
        yield Buffer.from(
          JSON.stringify({
            steps: [
              {
                stepCode: "A",
                name: "A",
                executionType: "manual",
                inputSchema: {},
                dependsOn: [],
                requiresVerification: false,
              },
            ],
          }),
        );
      },
    } as never;

    await expect(
      runWithRequestContext(
        {
          requestId: "r1",
          method: "PUT",
          path: "/api/admin/sops/template-versions/v1/prompts",
          auth: {
            userId: "admin",
            role: "admin",
            username: "admin",
            requiresPasswordChange: false,
          },
        },
        async () => {
          const res = { statusCode: 0, setHeader: () => undefined, end: () => undefined } as never;
          await controller.handle(req, res, { version_id: "v1" });
        },
      ),
    ).rejects.toMatchObject({ code: ErrorCode.OPERATION_NOT_ALLOWED } satisfies {
      code: typeof ErrorCode.OPERATION_NOT_ALLOWED;
    });
  });
});
