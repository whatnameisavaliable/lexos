import { describe, expect, it } from "vitest";
import {
  extractAsrPlainText,
  resolveTranscriptExportSections,
  stripHtml,
} from "./export-transcript-text.js";

describe("stripHtml", () => {
  it("removes tags and keeps readable text", () => {
    expect(stripHtml("<p>你好</p><p>世界</p>")).toBe("你好\n\n世界");
  });
});

describe("extractAsrPlainText", () => {
  it("joins segment texts", () => {
    expect(
      extractAsrPlainText({
        segments: [
          { text: "第一段" },
          { text: "第二段" },
        ],
      }),
    ).toBe("第一段\n\n第二段");
  });
});

describe("resolveTranscriptExportSections", () => {
  it("falls back to ASR when polished text is empty HTML", () => {
    expect(
      resolveTranscriptExportSections({
        title: "客户录音",
        polishedText: "<p></p>",
        summaryText: null,
        asrRawJson: {
          segments: [{ text: "ASR 源稿正文" }],
        },
      }),
    ).toEqual({
      title: "客户录音",
      summaryText: null,
      polishedText: "ASR 源稿正文",
    });
  });
});
