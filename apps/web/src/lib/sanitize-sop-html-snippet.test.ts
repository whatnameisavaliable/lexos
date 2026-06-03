import { describe, expect, it } from "vitest";
import { sanitizeSopHtmlSnippet } from "./sanitize-sop-html-snippet.js";

describe("sanitizeSopHtmlSnippet", () => {
  it("strips script tags", () => {
    const out = sanitizeSopHtmlSnippet("<p>x</p><script>alert(1)</script>");
    expect(out).not.toContain("<script");
    expect(out).toContain("<p>x</p>");
  });
});
