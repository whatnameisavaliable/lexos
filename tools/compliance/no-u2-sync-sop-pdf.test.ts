import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectSourceFiles,
  resolveComplianceRepoRoot,
} from "./scan-helpers.js";

/**
 * `architecture.md`：U2 禁止同步无头 PDF（Playwright 仅允许 U3 Worker）。
 */
describe("compliance: no U2 sync sop pdf (playwright in apps/api)", () => {
  it("apps/api production sources must not import playwright", () => {
    const repoRoot = resolveComplianceRepoRoot();
    const apiSources = collectSourceFiles(
      path.join(repoRoot, "apps/api/src"),
      [".ts", ".tsx"],
    ).filter((file) => !file.includes(`${path.sep}__tests__${path.sep}`));

    const violations: string[] = [];
    for (const file of apiSources) {
      const content = fs.readFileSync(file, "utf8");
      if (/from\s+["']playwright["']/.test(content)) {
        violations.push(path.relative(repoRoot, file));
      }
      if (/require\(\s*["']playwright["']\s*\)/.test(content)) {
        violations.push(path.relative(repoRoot, file));
      }
    }

    expect(violations).toEqual([]);
  });
});
