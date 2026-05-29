import { describe, expect, it } from "vitest";
import {
  ALLOWED_TRANSCRIPTION_MIME_TYPES,
  isMp4SourceMime,
  MAX_DURATION_SEC,
  MAX_SIZE_BYTES,
} from "./transcription-limits.js";

describe("transcription-limits", () => {
  it("matches database.md §7.1 constraints", () => {
    expect(MAX_SIZE_BYTES).toBe(1_073_741_824);
    expect(MAX_DURATION_SEC).toBe(18_000);
  });

  it("includes PRD §3.5.1 audio and mp4 mime types", () => {
    expect(ALLOWED_TRANSCRIPTION_MIME_TYPES).toContain("audio/mpeg");
    expect(ALLOWED_TRANSCRIPTION_MIME_TYPES).toContain("video/mp4");
  });

  it("detects mp4 video branch", () => {
    expect(isMp4SourceMime("video/mp4")).toBe(true);
    expect(isMp4SourceMime("audio/mpeg")).toBe(false);
  });
});
