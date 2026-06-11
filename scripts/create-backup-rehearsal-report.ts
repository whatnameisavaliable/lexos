import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  buildBackupRehearsalReport,
  compareManifestCreatedAt,
  formatBackupRehearsalMarkdown,
  formatBackupRehearsalReport,
  getBackupOperationsConfigFromEnv,
  getDatabaseManifestPath,
  getStorageManifestPath,
  isDatabaseBackupManifest,
  isStorageBackupManifest,
  type BackupRehearsalReport,
} from "../src/lib/operations/backup-operations.ts";
import {
  DATABASE_BACKUP_MANIFEST_FILE,
  type DatabaseBackupManifest,
} from "../src/lib/operations/database-backup.ts";
import {
  STORAGE_BACKUP_MANIFEST_FILE,
  type StorageBackupManifest,
} from "../src/lib/operations/storage-backup.ts";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const config = getBackupOperationsConfigFromEnv();
const backupRoot = readValueArg("--backup-root=") || config.backupRoot;
const reportDir = readValueArg("--report-dir=") || config.reportDir;
const useLatest = process.argv.includes("--latest");
const explicitDatabaseBackupDir = readValueArg("--db-backup-dir=");
const explicitStorageBackupDir = readValueArg("--storage-backup-dir=");
const databaseBackupDir = explicitDatabaseBackupDir || (useLatest ? findLatestDatabaseBackupDir(backupRoot) : "");
const storageBackupDir = explicitStorageBackupDir || (useLatest ? findLatestStorageBackupDir(backupRoot) : "");
const report = buildBackupRehearsalReport({
  databaseBackupDir,
  databaseExistingFiles: listTopLevelFiles(databaseBackupDir),
  databaseManifest: readDatabaseManifest(databaseBackupDir),
  storageBackupDir,
  storageExistingFiles: listRelativeFiles(storageBackupDir),
  storageManifest: readStorageManifest(storageBackupDir),
});

console.log(formatBackupRehearsalReport(report));

if (!report.ok) {
  process.exitCode = 1;
}

if (!process.argv.includes("--no-write")) {
  const outputDir = path.join(reportDir, report.rehearsalId);
  mkdirSync(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, "backup-rehearsal-report.json");
  const markdownPath = path.join(outputDir, "backup-rehearsal-report.md");
  writeFileSync(jsonPath, `${JSON.stringify(toSerializableReport(report), null, 2)}\n`, "utf8");
  writeFileSync(markdownPath, formatBackupRehearsalMarkdown(report), "utf8");
  console.log(`恢复演练报告已写入：${jsonPath}`);
  console.log(`恢复演练说明已写入：${markdownPath}`);
}

function readValueArg(prefix: string): string | undefined {
  const arg = process.argv.find((value) => value.startsWith(prefix));

  return arg?.slice(prefix.length);
}

function readDatabaseManifest(backupDir: string): DatabaseBackupManifest | undefined {
  if (!backupDir) {
    return undefined;
  }

  const manifest = readJsonFile(getDatabaseManifestPath(backupDir));

  return isDatabaseBackupManifest(manifest) ? manifest : undefined;
}

function readStorageManifest(backupDir: string): StorageBackupManifest | undefined {
  if (!backupDir) {
    return undefined;
  }

  const manifest = readJsonFile(getStorageManifestPath(backupDir));

  return isStorageBackupManifest(manifest) ? manifest : undefined;
}

function readJsonFile(filePath: string): unknown {
  if (!existsSync(filePath)) {
    return undefined;
  }

  return JSON.parse(readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function findLatestDatabaseBackupDir(rootDir: string): string {
  const candidates = listBackupDirectories(rootDir)
    .map((backupDir) => ({
      backupDir,
      manifest: readDatabaseManifest(backupDir),
    }))
    .filter((candidate): candidate is { backupDir: string; manifest: DatabaseBackupManifest } => Boolean(candidate.manifest))
    .sort((left, right) => compareManifestCreatedAt(left.manifest, right.manifest));

  return candidates[0]?.backupDir ?? "";
}

function findLatestStorageBackupDir(rootDir: string): string {
  const candidates = listBackupDirectories(rootDir)
    .map((backupDir) => ({
      backupDir,
      manifest: readStorageManifest(backupDir),
    }))
    .filter((candidate): candidate is { backupDir: string; manifest: StorageBackupManifest } => Boolean(candidate.manifest))
    .sort((left, right) => compareManifestCreatedAt(left.manifest, right.manifest));

  return candidates[0]?.backupDir ?? "";
}

function listBackupDirectories(rootDir: string): string[] {
  if (!rootDir || !existsSync(rootDir)) {
    return [];
  }

  return readdirSync(rootDir, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => path.join(rootDir, item.name));
}

function listTopLevelFiles(rootDir: string): string[] {
  if (!rootDir || !existsSync(rootDir)) {
    return [];
  }

  return readdirSync(rootDir, { withFileTypes: true })
    .filter((item) => item.isFile())
    .map((item) => item.name)
    .sort();
}

function listRelativeFiles(rootDir: string): string[] {
  if (!rootDir || !existsSync(rootDir)) {
    return [];
  }

  const root = path.resolve(rootDir);
  const files: string[] = [];
  const stack = [root];

  while (stack.length) {
    const current = stack.pop();

    if (!current) {
      continue;
    }

    for (const item of readdirSync(current, { withFileTypes: true })) {
      const absolutePath = path.join(current, item.name);

      if (item.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }

      if (item.isFile()) {
        files.push(path.relative(root, absolutePath).split(path.sep).join(path.posix.sep));
      }
    }
  }

  return files.sort();
}

function toSerializableReport(report: BackupRehearsalReport): BackupRehearsalReport & {
  database: BackupRehearsalReport["database"] & { expectedManifestFile: string };
  storage: BackupRehearsalReport["storage"] & { expectedManifestFile: string };
} {
  return {
    ...report,
    database: {
      ...report.database,
      expectedManifestFile: DATABASE_BACKUP_MANIFEST_FILE,
    },
    storage: {
      ...report.storage,
      expectedManifestFile: STORAGE_BACKUP_MANIFEST_FILE,
    },
  };
}
