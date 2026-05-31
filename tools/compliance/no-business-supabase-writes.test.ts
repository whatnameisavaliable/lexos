import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectSourceFiles,
  isTestOrGeneratedFile,
  resolveComplianceRepoRoot,
  scanFilesForPattern,
} from "./scan-helpers.js";

/**
 * `architecture.md` §5.7.1 / CONTEXT_SUMMARY §11：前端禁止业务表 Supabase 写操作。
 */
describe("compliance: no business supabase writes in web", () => {
  it("apps/web must not call supabase.from(...).insert|update|delete", () => {
    const webSrc = path.join(resolveComplianceRepoRoot(), "apps", "web", "src");
    const files = collectSourceFiles(webSrc, [".ts", ".tsx"]).filter(
      (f) => !isTestOrGeneratedFile(f),
    );

    const violations = scanFilesForPattern(
      files,
      /\.from\s*\([^)]+\)\s*\.\s*(insert|update|delete)\s*\(/,
    );

    expect(violations).toEqual([]);
  });
});
