import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveRepoRoot } from "./env.js";
import {
  assertEnvFilesGitignored,
  parseGitignoreLines,
  REQUIRED_ENV_GITIGNORE_ENTRIES,
} from "./gitignore-env.js";

describe("Root .gitignore env entries (M0-A)", () => {
  it("ignores .env, .env.development, .env.production", () => {
    expect(() => assertEnvFilesGitignored()).not.toThrow();
    const lines = parseGitignoreLines(
      fs.readFileSync(path.join(resolveRepoRoot(), ".gitignore"), "utf8"),
    );
    expect(lines).toEqual(
      expect.arrayContaining([...REQUIRED_ENV_GITIGNORE_ENTRIES]),
    );
  });
});
