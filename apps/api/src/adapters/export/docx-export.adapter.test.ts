import { describe, expect, it, vi } from "vitest";
import { DocxExportAdapter } from "./docx-export.adapter.js";

describe("DocxExportAdapter", () => {
  it("generates non-empty docx buffer without logging secrets", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const adapter = new DocxExportAdapter();
    const buffer = await adapter.generate({
      title: "庭审录音",
      polishedText: "证人陈述内容。",
      summaryText: "核心争议焦点。",
    });

    expect(buffer.byteLength).toBeGreaterThan(100);
    expect(buffer.subarray(0, 2).toString("utf-8")).toBe("PK");

    const logged = [...logSpy.mock.calls, ...errorSpy.mock.calls]
      .flat()
      .map((arg) => String(arg))
      .join(" ");
    expect(logged).not.toContain("证人陈述内容");

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
