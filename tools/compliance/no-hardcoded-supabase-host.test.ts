import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectSourceFiles,
  isTestOrGeneratedFile,
  resolveComplianceRepoRoot,
  scanFilesForPattern,
} from "./scan-helpers.js";

/**
 * `architecture.md` §4.4.2：业务源码禁止硬编码 `*.supabase.co` 域名。
 */
describe("compliance: no hardcoded supabase.co hosts", () => {
  it("production source must not contain *.supabase.co URL literals", () => {
    const repoRoot = resolveComplianceRepoRoot();
    const dirs = ["apps", "workers", "packages"].map((d) =>
      path.join(repoRoot, d),
    );
    const pattern = /https?:\/\/[^\s'"`]*\.supabase\.co/i;

    const files = dirs
      .flatMap((dir) => collectSourceFiles(dir, [".ts", ".tsx", ".js", ".mjs"]))
      .filter((file) => !isTestOrGeneratedFile(file))
      .filter((file) => !file.includes(".env"));

    const violations = scanFilesForPattern(files, pattern, (file, _line, text) => {
      const normalized = file.replace(/\\/g, "/");
      // 允许 URL 格式文档与校验错误消息（非连接端点）
      if (normalized.endsWith("supabase-project.ts")) {
        return (
          text.includes("expected") ||
          text.includes("Invalid SUPABASE_URL") ||
          text.trimStart().startsWith("*") ||
          text.trimStart().startsWith("//")
        );
      }
      return false;
    });

    expect(violations).toEqual([]);
  });
});
