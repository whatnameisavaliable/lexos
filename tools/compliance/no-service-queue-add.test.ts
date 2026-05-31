import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectSourceFiles,
  isTestOrGeneratedFile,
  resolveComplianceRepoRoot,
  scanFilesForPattern,
} from "./scan-helpers.js";

/**
 * `architecture.md` v1.3：U2 Service 禁止 `queue.add(`；API 禁止 bullmq/ioredis 生产依赖。
 */
describe("compliance: no BullMQ / queue.add in API services", () => {
  it("apps/api/src/services must not call queue.add(", () => {
    const servicesDir = path.join(
      resolveComplianceRepoRoot(),
      "apps",
      "api",
      "src",
      "services",
    );
    const files = collectSourceFiles(servicesDir, [".ts"]).filter(
      (f) => !isTestOrGeneratedFile(f),
    );
    const violations = scanFilesForPattern(files, /queue\.add\s*\(/);
    expect(violations).toEqual([]);
  });

  it("apps/api production dependencies must not include bullmq or ioredis", () => {
    const pkgPath = path.join(
      resolveComplianceRepoRoot(),
      "apps",
      "api",
      "package.json",
    );
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
      dependencies?: Record<string, string>;
    };
    const deps = Object.keys(pkg.dependencies ?? {});
    expect(deps).not.toContain("bullmq");
    expect(deps).not.toContain("ioredis");
  });
});
