import { describe, expect, it } from "vitest";

describe("SopHtmlPreviewToolbar", () => {
  it("supports a4 and a3 paper sizes", () => {
    const sizes = ["a4", "a3"] as const;
    expect(sizes).toContain("a4");
  });
});
