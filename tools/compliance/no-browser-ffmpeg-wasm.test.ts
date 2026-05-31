import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectSourceFiles,
  isTestOrGeneratedFile,
  resolveComplianceRepoRoot,
  scanFilesForPattern,
} from "./scan-helpers.js";

/**
 * PRD Out of Scope：禁止浏览器端 ffmpeg.wasm / @ffmpeg。
 */
describe("compliance: no browser ffmpeg.wasm", () => {
  it("apps/web source must not import ffmpeg.wasm or @ffmpeg", () => {
    const webSrc = path.join(resolveComplianceRepoRoot(), "apps", "web", "src");
    const files = collectSourceFiles(webSrc, [".ts", ".tsx"]).filter(
      (f) => !isTestOrGeneratedFile(f),
    );
    const violations = scanFilesForPattern(
      files,
      /ffmpeg\.wasm|@ffmpeg\//,
    );
    expect(violations).toEqual([]);
  });
});
