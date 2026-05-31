import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AUDIT_ACTION_VALUES } from "@lexos/shared";

const REPO_ROOT = join(import.meta.dirname, "../../../..");

function collectTsFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(full));
    } else if (entry.name.endsWith(".ts")) {
      files.push(full);
    }
  }
  return files;
}

const SCAN_DIRS = [
  join(REPO_ROOT, "apps/api/src/services"),
  join(REPO_ROOT, "apps/api/src/repositories"),
  join(REPO_ROOT, "workers/pipeline/src"),
];

const sources = SCAN_DIRS.flatMap(collectTsFiles);
const mergedSource = sources.map((f) => readFileSync(f, "utf8")).join("\n");

/** 动作在代码库中的引用别名（RPC / 适配器）。 */
const ACTION_ALIASES: Partial<Record<(typeof AUDIT_ACTION_VALUES)[number], string[]>> = {
  "auth.password_reset": ["auth.password_reset", "admin_apply_password_reset"],
};

describe("audit action coverage (static)", () => {
  it("each audit_action appears in at least one integration path", () => {
    const missing: string[] = [];

    for (const action of AUDIT_ACTION_VALUES) {
      const needles = ACTION_ALIASES[action] ?? [action];
      const found = needles.some((needle) => mergedSource.includes(needle));
      if (!found) {
        missing.push(action);
      }
    }

    expect(missing, `missing audit actions: ${missing.join(", ")}`).toEqual([]);
  });
});
