import { describe, expect, it } from "vitest";
import {
  findActiveSegmentIndex,
  formatTranscriptTimestamp,
  parseAsrSegments,
} from "./asr-segments.js";

describe("parseAsrSegments", () => {
  it("returns empty array for invalid input", () => {
    expect(parseAsrSegments(null)).toEqual([]);
    expect(parseAsrSegments({})).toEqual([]);
    expect(parseAsrSegments({ segments: "bad" })).toEqual([]);
  });

  it("parses camelCase segment fields", () => {
    expect(
      parseAsrSegments({
        segments: [
          {
            segmentIndex: 0,
            startMs: 0,
            endMs: 1500,
            text: "hello",
            speakerLabel: "A",
          },
          {
            segmentIndex: 1,
            startMs: 1500,
            endMs: 3000,
            text: "world",
          },
        ],
      }),
    ).toEqual([
      {
        segmentIndex: 0,
        startMs: 0,
        endMs: 1500,
        text: "hello",
        speakerLabel: "A",
      },
      {
        segmentIndex: 1,
        startMs: 1500,
        endMs: 3000,
        text: "world",
        speakerLabel: null,
      },
    ]);
  });

  it("parses snake_case segment fields", () => {
    expect(
      parseAsrSegments({
        segments: [
          {
            segment_index: 2,
            start_ms: 5000,
            end_ms: 8000,
            text: "test",
            speaker_label: "B",
          },
        ],
      }),
    ).toEqual([
      {
        segmentIndex: 2,
        startMs: 5000,
        endMs: 8000,
        text: "test",
        speakerLabel: "B",
      },
    ]);
  });
});

describe("findActiveSegmentIndex", () => {
  const segments = parseAsrSegments({
    segments: [
      { segmentIndex: 0, startMs: 0, endMs: 1000, text: "a" },
      { segmentIndex: 1, startMs: 1000, endMs: 2000, text: "b" },
      { segmentIndex: 2, startMs: 2000, endMs: 3000, text: "c" },
    ],
  });

  it("returns null for empty segments", () => {
    expect(findActiveSegmentIndex([], 500)).toBeNull();
  });

  it("highlights the latest segment at or before current time", () => {
    expect(findActiveSegmentIndex(segments, 0)).toBe(0);
    expect(findActiveSegmentIndex(segments, 999)).toBe(0);
    expect(findActiveSegmentIndex(segments, 1000)).toBe(1);
    expect(findActiveSegmentIndex(segments, 2500)).toBe(2);
  });
});

describe("formatTranscriptTimestamp", () => {
  it("formats milliseconds as MM:SS", () => {
    expect(formatTranscriptTimestamp(0)).toBe("00:00");
    expect(formatTranscriptTimestamp(65_000)).toBe("01:05");
    expect(formatTranscriptTimestamp(3_661_000)).toBe("61:01");
  });
});
