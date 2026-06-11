import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export const RELEASE_SENSITIVE_SCAN_KIND = "lexos-release-sensitive-scan";

export type ReleaseSensitiveFindingSeverity = "blocker" | "review";

export type ReleaseSensitiveFinding = {
  filePath: string;
  line: number;
  ruleId: string;
  severity: ReleaseSensitiveFindingSeverity;
  message: string;
};

export type ReleaseSensitiveScanReport = {
  version: 1;
  app: "lexos";
  kind: typeof RELEASE_SENSITIVE_SCAN_KIND;
  generatedAt: string;
  ok: boolean;
  scannedFiles: number;
  skippedFiles: string[];
  scannedRoots: string[];
  excludedPaths: string[];
  blockers: ReleaseSensitiveFinding[];
  reviewItems: ReleaseSensitiveFinding[];
  warnings: string[];
};

const scanRoots = [
  "app",
  "src",
  "scripts",
  "tests",
  "docs",
  "supabase/migrations",
  "package.json",
  "package-lock.json",
  "next.config.mjs",
  "tsconfig.json",
  "tailwind.config.ts",
  "postcss.config.mjs",
  "eslint.config.mjs",
  "playwright.config.ts",
  "playwright.preview.config.ts",
  ".env.example",
] as const;

const capabilityScanRoots = [
  "app",
  "src",
  "scripts",
  "supabase/migrations",
] as const;

const capabilityReviewExemptFiles = new Set([
  "src/lib/deployment/release-sensitive-scan.ts",
]);

const excludedPaths = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  ".next",
  "node_modules",
  "reports",
  "backups",
  "ops-logs",
  "playwright-report",
  "test-results",
  "coverage",
] as const;

const textExtensions = new Set([
  ".css",
  ".env",
  ".example",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".sql",
  ".ts",
  ".tsx",
  ".txt",
  ".yml",
  ".yaml",
]);

const maxScanFileBytes = 512 * 1024;

const blockerRules = [
  {
    id: "private-key-block",
    message: "发现疑似私钥块，交付包不得包含真实私钥。",
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  },
  {
    id: "database-url-with-password",
    message: "发现疑似带密码的数据库连接串，交付包不得包含真实连接信息。",
    pattern: /\b(?:postgres(?:ql)?|mysql):\/\/[^:\s/@]+:[^@\s]+@/i,
  },
  {
    id: "jwt-like-secret",
    message: "发现疑似 JWT / Supabase key 值，需从源码或文档中移除。",
    pattern: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/,
  },
  {
    id: "openai-api-key",
    message: "发现疑似 OpenAI API key，交付包不得包含真实第三方密钥。",
    pattern: /\bsk-[A-Za-z0-9_-]{24,}\b/,
  },
  {
    id: "github-token",
    message: "发现疑似 GitHub token，交付包不得包含真实访问令牌。",
    pattern: /\bgh[psuor]_[A-Za-z0-9_]{30,}\b/,
  },
  {
    id: "aws-access-key",
    message: "发现疑似 AWS access key，交付包不得包含真实云厂商密钥。",
    pattern: /\bAKIA[0-9A-Z]{16}\b/,
  },
] as const;

const reviewRules = [
  {
    id: "sms-capability-trace",
    message: "发现短信/真实短信相关线索；本期明确不开发真实短信接入，需人工确认只是边界说明或占位。",
    pattern: /(?:真实短信|短信接入|sms provider|twilio|aliyun.*sms|tencent.*sms)/i,
  },
  {
    id: "ai-capability-trace",
    message: "发现 AI 辅助或第三方大模型相关线索；本期明确不开发 AI 辅助功能，需人工确认只是边界说明或安全扫描规则。",
    pattern: /(?:AI 辅助|ai-assisted|openai|anthropic|deepseek|大模型)/i,
  },
  {
    id: "forbidden-roadmap-trace",
    message: "发现暂缓功能线索；需人工确认未实现新手保护期、新兵引流池或证据矩阵。",
    pattern: /(?:新手保护期|新兵引流池|证据矩阵)/,
  },
] as const;

export function buildReleaseSensitiveScanReport(options: {
  cwd?: string;
  generatedAt?: Date;
} = {}): ReleaseSensitiveScanReport {
  const cwd = options.cwd ?? process.cwd();
  const files = collectScanFiles(cwd);
  const blockers: ReleaseSensitiveFinding[] = [];
  const reviewItems: ReleaseSensitiveFinding[] = [];
  const skippedFiles: string[] = [];

  for (const filePath of files) {
    const absolutePath = path.join(cwd, ...filePath.split("/"));
    const fileStat = statSync(absolutePath);

    if (fileStat.size > maxScanFileBytes) {
      skippedFiles.push(`${filePath}（超过 ${maxScanFileBytes} bytes）`);
      continue;
    }

    const content = readFileSync(absolutePath, "utf8");
    const lines = content.split(/\r?\n/);

    lines.forEach((lineContent, index) => {
      for (const rule of blockerRules) {
        if (rule.pattern.test(lineContent)) {
          blockers.push({
            filePath,
            line: index + 1,
            message: rule.message,
            ruleId: rule.id,
            severity: "blocker",
          });
        }
      }

      if (!shouldReviewCapabilities(filePath)) {
        return;
      }

      for (const rule of reviewRules) {
        if (rule.pattern.test(lineContent)) {
          reviewItems.push({
            filePath,
            line: index + 1,
            message: rule.message,
            ruleId: rule.id,
            severity: "review",
          });
        }
      }
    });
  }

  return {
    version: 1,
    app: "lexos",
    kind: RELEASE_SENSITIVE_SCAN_KIND,
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    ok: blockers.length === 0,
    scannedFiles: files.length - skippedFiles.length,
    skippedFiles,
    scannedRoots: [...scanRoots],
    excludedPaths: [...excludedPaths],
    blockers,
    reviewItems,
    warnings: [
      "本扫描只读取交付包允许范围内的文本文件，不读取 .env.local，不连接线上 Supabase，不生成交付包。",
      "短信、AI、新手保护期、新兵引流池和证据矩阵相关命中为人工复核项；真实密钥、私钥或连接串样式命中为阻断项。",
    ],
  };
}

export function formatReleaseSensitiveScanReport(report: ReleaseSensitiveScanReport): string {
  const lines = [
    "# Lexos 私有化交付包敏感内容扫描",
    "",
    `生成时间：${report.generatedAt}`,
    `总体状态：${report.ok ? "通过" : "存在阻断项"}`,
    `已扫描文本文件：${report.scannedFiles}`,
    `阻断项：${report.blockers.length}`,
    `人工复核项：${report.reviewItems.length}`,
    "",
  ];

  if (report.blockers.length) {
    lines.push("## 阻断项", "");
    report.blockers.forEach((finding) => {
      lines.push(`- ${formatFinding(finding)}`);
    });
    lines.push("");
  }

  if (report.reviewItems.length) {
    lines.push("## 人工复核项", "");
    report.reviewItems.forEach((finding) => {
      lines.push(`- ${formatFinding(finding)}`);
    });
    lines.push("");
  }

  if (report.skippedFiles.length) {
    lines.push("## 跳过文件", "");
    report.skippedFiles.forEach((filePath) => lines.push(`- ${filePath}`));
    lines.push("");
  }

  lines.push("## 扫描范围", "");
  report.scannedRoots.forEach((rootPath) => lines.push(`- ${rootPath}`));
  lines.push("");
  lines.push("## 排除路径", "");
  report.excludedPaths.forEach((entryPath) => lines.push(`- ${entryPath}`));
  lines.push("");
  lines.push("## 提示", "");
  report.warnings.forEach((warning) => lines.push(`- ${warning}`));

  return lines.join("\n").trimEnd();
}

function collectScanFiles(cwd: string): string[] {
  return scanRoots.flatMap((rootPath) => {
    const absolutePath = path.join(cwd, ...rootPath.split("/"));

    if (!existsSync(absolutePath) || isExcludedPath(rootPath)) {
      return [];
    }

    const entryStat = statSync(absolutePath);

    if (entryStat.isDirectory()) {
      return walkDirectory(cwd, absolutePath);
    }

    return shouldScanTextFile(rootPath) ? [rootPath] : [];
  });
}

function walkDirectory(cwd: string, directoryPath: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
    const absolutePath = path.join(directoryPath, entry.name);
    const relativePath = normalizePath(path.relative(cwd, absolutePath));

    if (isExcludedPath(relativePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...walkDirectory(cwd, absolutePath));
      continue;
    }

    if (entry.isFile() && shouldScanTextFile(relativePath)) {
      files.push(relativePath);
    }
  }

  return files;
}

function shouldScanTextFile(filePath: string): boolean {
  const baseName = path.basename(filePath);

  if (baseName.startsWith(".env") && baseName !== ".env.example") {
    return false;
  }

  return textExtensions.has(path.extname(filePath));
}

function isExcludedPath(filePath: string): boolean {
  const normalized = normalizePath(filePath);

  return excludedPaths.some((excludedPath) => normalized === excludedPath || normalized.startsWith(`${excludedPath}/`));
}

function shouldReviewCapabilities(filePath: string): boolean {
  if (capabilityReviewExemptFiles.has(filePath)) {
    return false;
  }

  return capabilityScanRoots.some((rootPath) => filePath === rootPath || filePath.startsWith(`${rootPath}/`));
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function formatFinding(finding: ReleaseSensitiveFinding): string {
  return `${finding.filePath}:${finding.line} [${finding.ruleId}] ${finding.message}`;
}
