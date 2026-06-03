import { describe, expect, it } from "vitest";
import { SOP_HTML_IFRAME_SANDBOX } from "./sop-html-iframe-preview.js";

describe("SopHtmlIframePreview sandbox", () => {
  it("does not include allow-scripts", () => {
    expect(SOP_HTML_IFRAME_SANDBOX).toBe("allow-same-origin");
    expect(SOP_HTML_IFRAME_SANDBOX).not.toContain("allow-scripts");
  });
});
