import { describe, expect, it } from "vitest";
import { versionStatusLabel } from "./sop-version-status-badge.js";

describe("versionStatusLabel", () => {
  it("returns 已发布 when published", () => {
    expect(versionStatusLabel(true)).toBe("已发布");
  });

  it("returns 草稿 when draft", () => {
    expect(versionStatusLabel(false)).toBe("草稿");
  });
});
