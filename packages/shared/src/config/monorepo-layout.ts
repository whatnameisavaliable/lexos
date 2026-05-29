import fs from "node:fs";
import path from "node:path";
import { resolveRepoRoot } from "./env.js";

/** Monorepo 工作区包路径（`architecture.md` §2.1）。 */
export const MONOREPO_WORKSPACE_PACKAGES = [
  "apps/api",
  "apps/web",
  "workers/pipeline",
  "packages/shared",
] as const;

export type MonorepoWorkspacePackage = (typeof MONOREPO_WORKSPACE_PACKAGES)[number];

/**
 * 返回工作区包的绝对路径。
 */
export function getMonorepoPackagePath(
  pkg: MonorepoWorkspacePackage,
  repoRoot: string = resolveRepoRoot(),
): string {
  return path.join(repoRoot, ...pkg.split("/"));
}

/**
 * 断言 monorepo 目录骨架存在且含 `package.json`。
 */
export function assertMonorepoLayout(repoRoot: string = resolveRepoRoot()): void {
  for (const pkg of MONOREPO_WORKSPACE_PACKAGES) {
    const pkgRoot = getMonorepoPackagePath(pkg, repoRoot);
    if (!fs.existsSync(pkgRoot)) {
      throw new Error(`Missing workspace package directory: ${pkgRoot}`);
    }
    const manifest = path.join(pkgRoot, "package.json");
    if (!fs.existsSync(manifest)) {
      throw new Error(`Missing package.json for workspace: ${pkg}`);
    }
  }
}
