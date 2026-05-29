import fs from "node:fs";
import path from "node:path";
import { resolveRepoRoot } from "./env.js";

/** M0-A 要求在根 `.gitignore` 中忽略的 env 文件。 */
export const REQUIRED_ENV_GITIGNORE_ENTRIES = [
  ".env",
  ".env.development",
  ".env.production",
] as const;

/**
 * 解析 `.gitignore` 非注释、非空行。
 */
export function parseGitignoreLines(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

/**
 * 断言根 `.gitignore` 包含所有必需 env 忽略项。
 */
export function assertEnvFilesGitignored(
  repoRoot: string = resolveRepoRoot(),
): void {
  const gitignorePath = path.join(repoRoot, ".gitignore");
  if (!fs.existsSync(gitignorePath)) {
    throw new Error(`Missing .gitignore at ${gitignorePath}`);
  }
  const lines = parseGitignoreLines(fs.readFileSync(gitignorePath, "utf8"));
  for (const entry of REQUIRED_ENV_GITIGNORE_ENTRIES) {
    if (!lines.includes(entry)) {
      throw new Error(
        `.gitignore must ignore ${entry} (secrets must not be committed)`,
      );
    }
  }
}
