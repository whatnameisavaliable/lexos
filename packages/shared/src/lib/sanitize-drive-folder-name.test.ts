import { describe, expect, it } from "vitest";
import {
  DRIVE_FOLDER_NAME_MAX_LENGTH,
  sanitizeDriveFolderName,
} from "./sanitize-drive-folder-name.js";

describe("sanitizeDriveFolderName", () => {
  it("does not truncate long titles within limit", () => {
    const title = "会议".repeat(120);
    expect(sanitizeDriveFolderName(title).length).toBe(240);
  });

  it("replaces illegal path characters", () => {
    expect(sanitizeDriveFolderName('a/b:c*?')).toBe("a_b_c__");
  });

  it("throws when name exceeds column max after sanitization", () => {
    const tooLong = "x".repeat(DRIVE_FOLDER_NAME_MAX_LENGTH + 1);
    expect(() => sanitizeDriveFolderName(tooLong)).toThrow(/exceeds/);
  });
});
