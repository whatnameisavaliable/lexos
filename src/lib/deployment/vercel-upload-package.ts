import { existsSync, lstatSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export const VERCEL_UPLOAD_PACKAGE_KIND = "lexos-vercel-upload-package-check";

export type VercelUploadPackageCheck = {
  version: 1;
  app: "lexos";
  kind: typeof VERCEL_UPLOAD_PACKAGE_KIND;
  generatedAt: string;
  ok: boolean;
  includedFileCount: number;
  includedBytes: number;
  includedSamples: string[];
  ignoredPatternCount: number;
  requiredPathSummary: {
    required: number;
    missing: string[];
  };
  highRiskIncludedPaths: string[];
  sensitiveFindings: VercelUploadSensitiveFinding[];
  blockers: string[];
  warnings: string[];
};

export type VercelUploadSensitiveFinding = {
  filePath: string;
  line: number;
  ruleId: string;
  message: string;
};

const requiredUploadPaths = [
  ".vercelignore",
  "app",
  "package-lock.json",
  "package.json",
  "src",
  "next.config.mjs",
  "postcss.config.mjs",
  "tailwind.config.ts",
  "tsconfig.json",
] as const;

const highRiskDirectoryNames = new Set([
  ".git",
  ".next",
  ".tmp",
  "backups",
  "coverage",
  "dist",
  "node_modules",
  "playwright-report",
  "reports",
  "tests",
  "test-results",
]);

const highRiskDirectoryPaths = new Set([
  "supabase/.temp",
]);

const highRiskFilePatterns = [
  /^\.env(?:$|\.)/i,
  /^dev-server.*\.log$/i,
  /^.*\.log$/i,
  /^tsconfig\.tsbuildinfo$/i,
];

const textExtensions = new Set([
  ".css",
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

const sensitiveRules = [
  {
    id: "private-key-block",
    message: "Included upload file appears to contain a private key block.",
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  },
  {
    id: "database-url-with-password",
    message: "Included upload file appears to contain a database URL with a password.",
    pattern: /\b(?:postgres(?:ql)?|mysql):\/\/[^:\s/@]+:[^@\s]+@/i,
  },
  {
    id: "jwt-like-secret",
    message: "Included upload file appears to contain a JWT-like secret value.",
    pattern: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/,
  },
  {
    id: "third-party-api-key",
    message: "Included upload file appears to contain a third-party API key.",
    pattern: /\b(?:sk-[A-Za-z0-9_-]{24,}|gh[psuor]_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16})\b/,
  },
] as const;

export function buildVercelUploadPackageCheck(options: {
  cwd?: string;
  generatedAt?: Date;
} = {}): VercelUploadPackageCheck {
  const cwd = options.cwd ?? process.cwd();
  const ignorePatterns = readVercelIgnorePatterns(cwd);
  const inventory = collectUploadInventory(cwd, ignorePatterns);
  const missingRequiredPaths = requiredUploadPaths.filter((entryPath) => !existsSync(path.join(cwd, ...entryPath.split("/"))));
  const sensitiveFindings = scanIncludedFiles(cwd, inventory.includedFiles);
  const blockers: string[] = [];
  const warnings: string[] = [
    "This check is read-only. It does not create an archive, upload files, contact Vercel, push git, or read .env.local values.",
  ];

  if (!ignorePatterns.length) {
    blockers.push("No .vercelignore patterns were found. Vercel upload package boundaries cannot be verified.");
  }

  if (missingRequiredPaths.length) {
    blockers.push(`Vercel upload package is missing required project paths: ${missingRequiredPaths.join(", ")}.`);
  }

  if (inventory.highRiskIncludedPaths.length) {
    blockers.push(`High-risk local paths would be included in the Vercel upload package: ${inventory.highRiskIncludedPaths.join(", ")}.`);
  }

  if (sensitiveFindings.length) {
    blockers.push(`Sensitive-looking content was found in files that would be uploaded: ${sensitiveFindings.length} finding(s).`);
  }

  if (inventory.symlinkPaths.length) {
    warnings.push(`Symlinks were skipped during upload simulation: ${inventory.symlinkPaths.join(", ")}.`);
  }

  return {
    version: 1,
    app: "lexos",
    kind: VERCEL_UPLOAD_PACKAGE_KIND,
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    ok: blockers.length === 0,
    includedFileCount: inventory.includedFiles.length,
    includedBytes: inventory.includedBytes,
    includedSamples: inventory.includedFiles.slice(0, 25),
    ignoredPatternCount: ignorePatterns.length,
    requiredPathSummary: {
      required: requiredUploadPaths.length,
      missing: missingRequiredPaths,
    },
    highRiskIncludedPaths: inventory.highRiskIncludedPaths,
    sensitiveFindings,
    blockers,
    warnings,
  };
}

export function formatVercelUploadPackageCheck(check: VercelUploadPackageCheck): string {
  const lines = [
    "# Lexos Vercel Upload Package Check",
    "",
    `Generated at: ${check.generatedAt}`,
    `Status: ${check.ok ? "passed" : "blocked"}`,
    `Included files: ${check.includedFileCount}`,
    `Included bytes: ${check.includedBytes}`,
    `Ignore patterns: ${check.ignoredPatternCount}`,
    `Required paths: ${check.requiredPathSummary.required - check.requiredPathSummary.missing.length}/${check.requiredPathSummary.required}`,
    `High-risk included paths: ${check.highRiskIncludedPaths.length}`,
    `Sensitive findings: ${check.sensitiveFindings.length}`,
    `Command: \`npm.cmd run deploy:upload:check\``,
    "",
  ];

  if (check.blockers.length) {
    lines.push("## Blockers", "");
    check.blockers.forEach((blocker) => lines.push(`- ${blocker}`));
    lines.push("");
  }

  if (check.sensitiveFindings.length) {
    lines.push("## Sensitive Findings", "");
    check.sensitiveFindings.forEach((finding) => {
      lines.push(`- ${finding.filePath}:${finding.line} [${finding.ruleId}] ${finding.message}`);
    });
    lines.push("");
  }

  if (check.warnings.length) {
    lines.push("## Warnings", "");
    check.warnings.forEach((warning) => lines.push(`- ${warning}`));
    lines.push("");
  }

  lines.push("## Included File Sample", "");
  check.includedSamples.forEach((filePath) => lines.push(`- ${filePath}`));
  lines.push("");
  lines.push("## Execution Boundary", "");
  lines.push("- This command only simulates local Vercel upload package boundaries.");
  lines.push("- It does not create a tarball, upload code, call Vercel APIs, or push git.");
  lines.push("- It does not read .env.local values; ignored environment files are checked by path only.");

  return lines.join("\n").trimEnd();
}

function collectUploadInventory(cwd: string, ignorePatterns: IgnorePattern[]): {
  highRiskIncludedPaths: string[];
  includedBytes: number;
  includedFiles: string[];
  symlinkPaths: string[];
} {
  const highRiskIncludedPaths = new Set<string>();
  const includedFiles: string[] = [];
  const symlinkPaths: string[] = [];
  let includedBytes = 0;

  function walk(relativeDir: string): void {
    const absoluteDir = path.join(cwd, ...relativeDir.split("/").filter(Boolean));

    for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
      const relativePath = normalizePath(path.posix.join(relativeDir, entry.name));
      const absolutePath = path.join(cwd, ...relativePath.split("/"));

      if (isIgnored(relativePath, entry.isDirectory(), ignorePatterns)) {
        continue;
      }

      const entryStat = lstatSync(absolutePath);

      if (entryStat.isSymbolicLink()) {
        symlinkPaths.push(relativePath);
        continue;
      }

      if (entry.isDirectory()) {
        if (isHighRiskDirectory(relativePath, entry.name)) {
          highRiskIncludedPaths.add(`${relativePath}/`);
          continue;
        }

        walk(relativePath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (isHighRiskFile(relativePath)) {
        highRiskIncludedPaths.add(relativePath);
        continue;
      }

      includedFiles.push(relativePath);
      includedBytes += entryStat.size;
    }
  }

  walk("");

  return {
    highRiskIncludedPaths: Array.from(highRiskIncludedPaths).sort(),
    includedBytes,
    includedFiles: includedFiles.sort(),
    symlinkPaths: symlinkPaths.sort(),
  };
}

function scanIncludedFiles(cwd: string, files: string[]): VercelUploadSensitiveFinding[] {
  const findings: VercelUploadSensitiveFinding[] = [];

  for (const filePath of files) {
    const extension = path.extname(filePath).toLowerCase();

    if (!textExtensions.has(extension) && !filePath.endsWith(".env.example")) {
      continue;
    }

    const absolutePath = path.join(cwd, ...filePath.split("/"));
    const fileStat = statSync(absolutePath);

    if (fileStat.size > maxScanFileBytes) {
      continue;
    }

    const lines = readFileSync(absolutePath, "utf8").split(/\r?\n/);

    lines.forEach((line, index) => {
      sensitiveRules.forEach((rule) => {
        if (rule.pattern.test(line)) {
          findings.push({
            filePath,
            line: index + 1,
            message: rule.message,
            ruleId: rule.id,
          });
        }
      });
    });
  }

  return findings;
}

type IgnorePattern = {
  directoryOnly: boolean;
  regex: RegExp;
};

function readVercelIgnorePatterns(cwd: string): IgnorePattern[] {
  const ignorePath = path.join(cwd, ".vercelignore");

  if (!existsSync(ignorePath)) {
    return [];
  }

  return readFileSync(ignorePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#") && !line.startsWith("!"))
    .map((line) => buildIgnorePattern(line));
}

function buildIgnorePattern(pattern: string): IgnorePattern {
  const normalized = normalizePath(pattern);
  const directoryOnly = normalized.endsWith("/");
  const cleanPattern = directoryOnly ? normalized.slice(0, -1) : normalized;
  const hasSlash = cleanPattern.includes("/");
  const source = globToRegexSource(cleanPattern);

  if (directoryOnly) {
    return {
      directoryOnly,
      regex: new RegExp(hasSlash ? `^${source}(?:/.*)?$` : `(?:^|/)${source}(?:/.*)?$`),
    };
  }

  return {
    directoryOnly,
    regex: new RegExp(hasSlash ? `^${source}$` : `(?:^|/)${source}$`),
  };
}

function isIgnored(relativePath: string, isDirectory: boolean, patterns: IgnorePattern[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.directoryOnly && !isDirectory) {
      const parentMatch = pattern.regex.test(relativePath);
      return parentMatch;
    }

    return pattern.regex.test(relativePath);
  });
}

function isHighRiskDirectory(relativePath: string, name: string): boolean {
  return highRiskDirectoryNames.has(name) || highRiskDirectoryPaths.has(relativePath);
}

function isHighRiskFile(relativePath: string): boolean {
  if (relativePath === ".env.example") {
    return false;
  }

  const fileName = path.posix.basename(relativePath);
  return highRiskFilePatterns.some((pattern) => pattern.test(fileName));
}

function globToRegexSource(pattern: string): string {
  return pattern
    .split("*")
    .map((part) => part.replace(/[|\\{}()[\]^$+?.]/g, "\\$&"))
    .join("[^/]*");
}

function normalizePath(value: string): string {
  return value.replaceAll("\\", "/").replace(/^\/+/, "").replace(/\/+/g, "/");
}
