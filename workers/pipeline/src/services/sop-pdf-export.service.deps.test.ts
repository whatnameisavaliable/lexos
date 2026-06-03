import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveComplianceRepoRoot } from "../../../../tools/compliance/scan-helpers.js";

describe("sop-pdf-export playwright dependency", () => {
  it("workers/pipeline package.json declares playwright", () => {
    const pkgPath = path.join(
      resolveComplianceRepoRoot(),
      "workers/pipeline/package.json",
    );
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
      dependencies?: Record<string, string>;
    };
    expect(pkg.dependencies?.playwright).toBeTruthy();
  });
});
