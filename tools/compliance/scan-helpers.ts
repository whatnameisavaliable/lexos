import fs from "node:fs";
import path from "node:path";

/** 合规扫描命中项。 */
export interface ComplianceViolation {
  readonly file: string;
  readonly line: number;
  readonly text: string;
}

const DEFAULT_IGNORE_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  ".git",
  "coverage",
]);

/**
 * 递归收集目录下匹配扩展名的源文件。
 *
 * @param rootDir - 扫描根目录
 * @param extensions - 如 `['.ts', '.tsx']`
 * @param ignoreDirNames - 额外忽略的目录名
 */
export function collectSourceFiles(
  rootDir: string,
  extensions: readonly string[],
  ignoreDirNames: ReadonlySet<string> = DEFAULT_IGNORE_DIRS,
): string[] {
  const results: string[] = [];

  function walk(current: string): void {
    if (!fs.existsSync(current)) {
      return;
    }
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!ignoreDirNames.has(entry.name)) {
          walk(fullPath);
        }
        continue;
      }
      const ext = path.extname(entry.name);
      if (extensions.includes(ext)) {
        results.push(fullPath);
      }
    }
  }

  walk(rootDir);
  return results;
}

/**
 * 排除测试文件与构建产物路径。
 *
 * @param filePath - 绝对或相对文件路径
 */
export function isTestOrGeneratedFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return (
    normalized.includes(".test.ts") ||
    normalized.includes(".test.tsx") ||
    normalized.includes("/__tests__/") ||
    normalized.includes("/.next/") ||
    normalized.endsWith(".d.ts")
  );
}

/**
 * 在文件集合中搜索正则匹配行。
 *
 * @param files - 待扫描文件路径
 * @param pattern - 违规正则
 * @param isAllowed - 可选白名单谓词（file, line, text）
 */
export function scanFilesForPattern(
  files: readonly string[],
  pattern: RegExp,
  isAllowed?: (file: string, line: number, text: string) => boolean,
): ComplianceViolation[] {
  const violations: ComplianceViolation[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const text = lines[i] ?? "";
      if (pattern.test(text)) {
        if (isAllowed?.(file, i + 1, text)) {
          continue;
        }
        violations.push({ file, line: i + 1, text: text.trim() });
      }
    }
  }

  return violations;
}

/**
 * 解析 monorepo 根目录（自 compliance 工具位置向上两级）。
 */
export function resolveComplianceRepoRoot(): string {
  return path.resolve(import.meta.dirname, "..", "..");
}
