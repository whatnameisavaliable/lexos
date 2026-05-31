import { describe, expect, it } from "vitest";
import {
  buildObjectStorageKey,
  sanitizeUploadFileName,
} from "./transcription-storage-key.js";

describe("sanitizeUploadFileName", () => {
  it("replaces non-ASCII characters for Supabase Storage keys", () => {
    expect(sanitizeUploadFileName("录音.m4a")).toBe("__.m4a");
  });

  it("strips path segments", () => {
    expect(sanitizeUploadFileName("C:\\dir\\hearing.mp3")).toBe("hearing.mp3");
  });
});

describe("buildObjectStorageKey", () => {
  it("joins prefix and sanitized file name", () => {
    expect(buildObjectStorageKey("uid/task/", "录音.m4a")).toBe(
      "uid/task/__.m4a",
    );
  });
});
