import { describe, expect, it, vi } from "vitest";
import { SOP_STAGE_PDF_EXPORT } from "@lexos/shared";
import { SopStageRouter } from "./sop-stage-router.js";

describe("SopStageRouter", () => {
  it("resolves sop.pdf_export handler", () => {
    const handler = { handle: vi.fn() };
    const router = new SopStageRouter({
      [SOP_STAGE_PDF_EXPORT]: handler,
    });

    expect(router.resolve(SOP_STAGE_PDF_EXPORT)).toBe(handler);
  });
});
