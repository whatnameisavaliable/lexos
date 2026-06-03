import { describe, expect, it } from "vitest";
import { renderPreviewResult } from "./sop-admin-ui-utils.js";

describe("SopPreviewPipelineDialog", () => {
  it("renders preview as pre text", () => {
    expect(renderPreviewResult("hello").tag).toBe("pre");
  });
});
