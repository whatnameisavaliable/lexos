import { describe, expect, it } from "vitest";
import { concatSopMediaText } from "./concat-sop-media-text.js";

describe("concatSopMediaText", () => {
  it("concatenates multiple files in order with headers", () => {
    const result = concatSopMediaText([
      { fileName: "a.mp3", text: "文本A" },
      { fileName: "b.mp3", text: "文本B" },
    ]);

    expect(result).toBe(
      "--- a.mp3 ---\n文本A\n\n--- b.mp3 ---\n文本B",
    );
  });

  it("preserves file order", () => {
    const result = concatSopMediaText([
      { fileName: "first.pdf", text: "1" },
      { fileName: "second.pdf", text: "2" },
    ]);
    expect(result.indexOf("first.pdf")).toBeLessThan(result.indexOf("second.pdf"));
  });
});
