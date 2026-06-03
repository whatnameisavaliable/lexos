import { describe, expect, it } from "vitest";
import { buildIframeSrcdoc } from "./build-iframe-srcdoc.js";

describe("buildIframeSrcdoc", () => {
  it("wraps html without injecting script tags", () => {
    const doc = buildIframeSrcdoc("<p>hi</p>");
    expect(doc).toContain("<p>hi</p>");
    expect(doc.toLowerCase()).not.toContain("<script");
  });
});
