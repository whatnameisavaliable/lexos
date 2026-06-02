import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveRepoRoot } from "./env.js";

describe("SOP worker env template (.env.example)", () => {
  it("documents SOP_PDF_MAX_CONCURRENT, SOP_DEEP_RESEARCH_MAX_CONCURRENT, SOP_DEEP_RESEARCH_TIMEOUT_MS", () => {
    const envExample = fs.readFileSync(
      path.join(resolveRepoRoot(), ".env.example"),
      "utf8",
    );
    expect(envExample).toContain("SOP_PDF_MAX_CONCURRENT=1");
    expect(envExample).toContain("SOP_DEEP_RESEARCH_MAX_CONCURRENT=2");
    expect(envExample).toContain("SOP_DEEP_RESEARCH_TIMEOUT_MS=1800000");
  });
});
