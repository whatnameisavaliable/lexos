import { describe, expect, it } from "vitest";
import { formatMediaFilenameHeader } from "./format-media-filename-header.js";

describe("formatMediaFilenameHeader", () => {
  it("wraps file name with triple-dash separators", () => {
    expect(formatMediaFilenameHeader("证据A.pdf")).toBe("--- 证据A.pdf ---");
  });
});
