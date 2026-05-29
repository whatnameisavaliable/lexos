import { describe, expect, it } from "vitest";
import {
  MONOREPO_WORKSPACE_PACKAGES,
  assertMonorepoLayout,
  getMonorepoPackagePath,
} from "./monorepo-layout.js";

describe("Monorepo layout (architecture §2.1)", () => {
  it("includes apps/api, apps/web, workers/pipeline, packages/shared", () => {
    expect(MONOREPO_WORKSPACE_PACKAGES).toEqual([
      "apps/api",
      "apps/web",
      "workers/pipeline",
      "packages/shared",
    ]);
    expect(() => assertMonorepoLayout()).not.toThrow();
    expect(getMonorepoPackagePath("apps/api")).toMatch(/apps[\\/]api$/);
  });
});
