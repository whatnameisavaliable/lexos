import { describe, expect, it, vi } from "vitest";
import { PdfExportAdapter } from "./pdf-export.adapter.js";

describe("PdfExportAdapter", () => {
  it("generates a PDF with visible Chinese content", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const adapter = new PdfExportAdapter();
    const buffer = await adapter.generate({
      title: "客户录音",
      polishedText: "证人陈述内容，包含中文标点。",
      summaryText: "核心争议焦点摘要。",
    });

    expect(buffer.subarray(0, 4).toString("utf-8")).toBe("%PDF");
    expect(buffer.byteLength).toBeGreaterThan(3_000);

    const logged = [...logSpy.mock.calls, ...errorSpy.mock.calls]
      .flat()
      .map((arg) => String(arg))
      .join(" ");
    expect(logged).not.toContain("证人陈述内容");

    logSpy.mockRestore();
    errorSpy.mockRestore();
  }, 60_000);
});
