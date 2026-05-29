import fs from "node:fs";
import path from "node:path";
import { resolveRepoRoot } from "../config/env.js";

/** M0 子阶段前缀（`tasks.md` 中 ### M0-A～M0-D）。 */
export const M0_SECTION_PREFIXES = [
  "### M0-A",
  "### M0-B",
  "### M0-C",
  "### M0-D",
] as const;

function isM0SubtaskSection(header: string): boolean {
  return M0_SECTION_PREFIXES.some((prefix) => header.startsWith(prefix));
}

/** 未完成的 M0 子任务行（原始 markdown 行）。 */
export interface M0IncompleteTask {
  readonly section: string;
  readonly line: string;
}

/**
 * 从 `tasks.md` 文本中提取 M0-A～M0-D 区间内仍为 `- [ ]` 的条目。
 */
export function findIncompleteM0Subtasks(
  tasksMarkdown: string,
): M0IncompleteTask[] {
  const lines = tasksMarkdown.split(/\r?\n/);
  const incomplete: M0IncompleteTask[] = [];
  let currentSection = "";

  for (const line of lines) {
    if (line.startsWith("### M0-E")) {
      break;
    }
    if (line.startsWith("### M0-")) {
      currentSection = line.trim();
      continue;
    }
    if (currentSection && isM0SubtaskSection(currentSection) && /^- \[ \]/.test(line)) {
      incomplete.push({ section: currentSection, line: line.trim() });
    }
  }

  return incomplete;
}

/**
 * 断言 M0-A～M0-D 所有 checkbox 已为 `[x]`（M0-E 门禁第一项）。
 */
export function assertM0SubtasksComplete(
  repoRoot: string = resolveRepoRoot(),
): void {
  const tasksPath = path.join(repoRoot, "docs", "tasks.md");
  if (!fs.existsSync(tasksPath)) {
    throw new Error(`Missing tasks file: ${tasksPath}`);
  }

  const markdown = fs.readFileSync(tasksPath, "utf8");
  const incomplete = findIncompleteM0Subtasks(markdown);

  if (incomplete.length > 0) {
    const summary = incomplete
      .map((item) => `${item.section}: ${item.line}`)
      .join("\n");
    throw new Error(
      `M0 subtasks incomplete (${incomplete.length}):\n${summary}`,
    );
  }
}
