import { describe, expect, it } from "vitest";
import { loadPdfCjkFontBuffer } from "./pdf-cjk-font.js";

describe("loadPdfCjkFontBuffer", () => {
  it("returns decompressed TTF buffer for bundled Noto Sans SC", async () => {
    const fontBuffer = await loadPdfCjkFontBuffer();
    expect(fontBuffer.byteLength).toBeGreaterThan(100_000);
    expect(fontBuffer.subarray(0, 4)).toEqual(Buffer.from([0x00, 0x01, 0x00, 0x00]));
  });
});
