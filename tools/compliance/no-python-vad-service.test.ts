import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { collectSourceFiles, resolveComplianceRepoRoot } from "./scan-helpers.js";

const PYTHON_VAD_DIR_NAMES = [
  "vad-service",
  "vad_service",
  "python-vad",
  "py-vad",
  "services/vad",
] as const;

const PYTHON_VAD_PACKAGE_PATTERNS = [
  /python-vad/i,
  /vad-microservice/i,
  /pyvad/i,
] as const;

/**
 * PRD Out of Scope：禁止独立 Python VAD 微服务目录/依赖。
 */
describe("compliance: no standalone Python VAD microservice", () => {
  it("repo must not contain dedicated Python VAD service directories", () => {
    const repoRoot = resolveComplianceRepoRoot();
    const found = PYTHON_VAD_DIR_NAMES.filter((dir) =>
      fs.existsSync(path.join(repoRoot, dir)),
    );
    expect(found).toEqual([]);
  });

  it("package.json files must not declare python-vad microservice dependencies", () => {
    const repoRoot = resolveComplianceRepoRoot();
    const pkgFiles = collectSourceFiles(repoRoot, [".json"]).filter((f) =>
      f.endsWith("package.json"),
    );

    const violations: string[] = [];
    for (const pkgFile of pkgFiles) {
      const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8")) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };
      for (const name of Object.keys(allDeps)) {
        if (PYTHON_VAD_PACKAGE_PATTERNS.some((p) => p.test(name))) {
          violations.push(`${pkgFile}: ${name}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("repo root must not contain requirements.txt for Python VAD service", () => {
    const repoRoot = resolveComplianceRepoRoot();
    const requirementsPath = path.join(repoRoot, "requirements.txt");
    expect(fs.existsSync(requirementsPath)).toBe(false);
  });
});
