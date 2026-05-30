import { describe, expect, it } from "vitest";
import {
  parseTranscriptIfMatchHeader,
  parseTranscriptPatchBody,
  POLISHED_TEXT_MAX_LENGTH,
} from "./transcript-patch.dto.js";

describe("transcript-patch.dto", () => {
  it("parses valid polishedText body", () => {
    expect(parseTranscriptPatchBody({ polishedText: "hello" })).toEqual({
      polishedText: "hello",
    });
  });

  it("rejects empty polishedText object missing field", () => {
    expect(() => parseTranscriptPatchBody({})).toThrow();
  });

  it("rejects polishedText exceeding max length", () => {
    expect(() =>
      parseTranscriptPatchBody({
        polishedText: "x".repeat(POLISHED_TEXT_MAX_LENGTH + 1),
      }),
    ).toThrow();
  });

  it("parses valid If-Match version", () => {
    expect(parseTranscriptIfMatchHeader("3")).toBe(3);
    expect(parseTranscriptIfMatchHeader("  12  ")).toBe(12);
  });

  it("rejects missing or invalid If-Match", () => {
    expect(() => parseTranscriptIfMatchHeader(undefined)).toThrow(
      /If-Match header is required/,
    );
    expect(() => parseTranscriptIfMatchHeader("0")).toThrow(
      /positive integer/,
    );
    expect(() => parseTranscriptIfMatchHeader("abc")).toThrow(
      /positive integer/,
    );
  });
});
