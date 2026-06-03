import { describe, expect, it } from "vitest";
import { SOP_DEEP_RESEARCH_OFFLINE_MESSAGE } from "./sop-deep-research-offline-banner.js";

describe("SopDeepResearchOfflineBanner", () => {
  it("uses fixed offline copy", () => {
    expect(SOP_DEEP_RESEARCH_OFFLINE_MESSAGE).toContain("外网检索不可用");
  });
});
