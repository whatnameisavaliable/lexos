import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  buildStorageRestorePlan,
  formatStorageRestorePlan,
  getStorageRestoreConfigFromEnv,
  resolveStorageBackupFilePath,
  STORAGE_BACKUP_MANIFEST_FILE,
  STORAGE_RESTORE_CONFIRMATION,
  type StorageBackupManifest,
} from "../src/lib/operations/storage-backup.ts";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main(): Promise<void> {
  const config = getStorageRestoreConfigFromEnv();
  const backupDir = readValueArg("--backup-dir=") || config.backupDir;
  const bucket = readValueArg("--bucket=") || config.bucket;
  const executeRequested = process.argv.includes("--execute") || config.executeRequested;
  const upsert = process.argv.includes("--upsert") || config.upsert;
  const existingFiles = backupDir && existsSync(backupDir) ? listRelativeFiles(backupDir) : [];
  const manifest = backupDir ? readManifest(backupDir) : undefined;
  const plan = buildStorageRestorePlan({
    backupDir,
    bucket,
    confirmation: process.env.LEXOS_STORAGE_RESTORE_CONFIRM,
    executeRequested,
    existingFiles,
    manifest,
    serviceRoleKey: config.serviceRoleKey,
    supabaseUrl: config.supabaseUrl,
    upsert,
  });

  console.log(formatStorageRestorePlan(plan));

  if (!plan.ok) {
    process.exitCode = 1;
    return;
  }

  if (plan.dryRun) {
    console.log(`当前仅为 Storage 恢复演练。如需执行，请追加 --execute 并设置 LEXOS_STORAGE_RESTORE_CONFIRM=${STORAGE_RESTORE_CONFIRMATION}。`);
    return;
  }

  if (!plan.manifest) {
    throw new Error(`缺少 ${STORAGE_BACKUP_MANIFEST_FILE}`);
  }

  const client = createSupabaseClient(config.supabaseUrl, config.serviceRoleKey);

  for (const object of plan.manifest.objects) {
    const filePath = resolveStorageBackupFilePath(plan.backupDir, object.localPath);
    const fileBody = readFileSync(filePath);
    const uploadOptions: {
      contentType?: string;
      metadata?: Record<string, unknown>;
      upsert: boolean;
    } = {
      upsert: plan.upsert,
    };

    if (object.mimeType) {
      uploadOptions.contentType = object.mimeType;
    }

    if (object.metadata) {
      uploadOptions.metadata = object.metadata;
    }

    const { error } = await client.storage.from(plan.bucket).upload(object.path, fileBody, uploadOptions);

    if (error) {
      throw new Error(`恢复 Storage 对象失败：${object.path}：${error.message}`);
    }
  }

  console.log(`Storage 对象恢复脚本执行完成：${plan.manifest.objects.length} 个对象。请继续运行数据库恢复后核对、RLS 验证和真实闭环 smoke。`);
}

function readValueArg(prefix: string): string | undefined {
  const arg = process.argv.find((value) => value.startsWith(prefix));

  return arg?.slice(prefix.length);
}

function readManifest(backupDir: string): StorageBackupManifest | undefined {
  const manifestPath = path.join(backupDir, STORAGE_BACKUP_MANIFEST_FILE);

  if (!existsSync(manifestPath)) {
    return undefined;
  }

  return JSON.parse(readFileSync(manifestPath, "utf8").replace(/^\uFEFF/, "")) as StorageBackupManifest;
}

function listRelativeFiles(rootDir: string): string[] {
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

function createSupabaseClient(supabaseUrl: string, serviceRoleKey: string): SupabaseClient {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
