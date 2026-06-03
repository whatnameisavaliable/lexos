import { describe, expect, it } from "vitest";
import { SOP_HTML_PREVIEW_DEBOUNCE_MS } from "./sop-artifact-html-split-pane.js";

describe("SopArtifactHtmlSplitPane", () => {
  it("debounces preview at 500ms", () => {
    expect(SOP_HTML_PREVIEW_DEBOUNCE_MS).toBe(500);
  });
});
