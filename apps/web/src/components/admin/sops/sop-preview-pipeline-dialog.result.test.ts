import { describe, expect, it } from "vitest";
import { renderPreviewResult } from "./sop-admin-ui-utils.js";

describe("renderPreviewResult", () => {
  it("renders markdown as pre text", () => {
    const rendered = renderPreviewResult("# Title\n\nBody");
    expect(rendered.tag).toBe("pre");
    expect(rendered.text).toContain("# Title");
  });
});
