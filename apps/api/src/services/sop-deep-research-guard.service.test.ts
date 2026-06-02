import { describe, expect, it, vi } from "vitest";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { SopDeepResearchGuardService } from "./sop-deep-research-guard.service.js";

describe("SopDeepResearchGuardService", () => {
  it("throws OPERATION_NOT_ALLOWED when disabled", async () => {
    const settings = {
      isDeepResearchEnabled: vi.fn(async () => false),
    };
    const guard = new SopDeepResearchGuardService(settings as never);
    await expect(guard.assertDeepResearchEnabled()).rejects.toMatchObject({
      code: ErrorCode.OPERATION_NOT_ALLOWED,
    } satisfies Partial<AppHttpError>);
  });
});
