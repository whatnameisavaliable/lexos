import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { dirname } from "node:path";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import process from "node:process";

import {
  buildStorageBackupManifest,
  buildStorageBackupPlan,
  buildStorageObjectEntry,
  formatStorageBackupPlan,
  getStorageBackupConfigFromEnv,
  isStorageFolderEntry,
  resolveStorageBackupFilePath,
  STORAGE_BACKUP_MANIFEST_FILE,
  type ListedStorageItem,
  type StorageObjectEntry,
} from "../src/lib/operations/storage-backup.ts";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main(): Promise<void> {
  const config = getStorageBackupConfigFromEnv();
  const dryRun = process.argv.includes("--dry-run") || config.dryRun;
  const basePlan = buildStorageBackupPlan({
    backupRoot: config.backupRoot,
    bucket: config.bucket,
    dryRun,
    serviceRoleKey: config.serviceRoleKey,
    supabaseUrl: config.supabaseUrl,
  });

  if (dryRun) {
    console.log(formatStorageBackupPlan(basePlan));
    process.exitCode = basePlan.ok ? 0 : 1;
    return;
  }

  if (!basePlan.ok) {
    console.log(formatStorageBackupPlan(basePlan));
    process.exitCode = 1;
    return;
  }

  const client = createSupabaseClient(config.supabaseUrl, config.serviceRoleKey);
  const objects = await listStorageObjects(client, basePlan.bucket);
  const plan = buildStorageBackupPlan({
    backupId: basePlan.backupId,
    backupRoot: config.backupRoot,
    bucket: basePlan.bucket,
    dryRun: false,
    objects,
    serviceRoleKey: config.serviceRoleKey,
    supabaseUrl: config.supabaseUrl,
  });

  console.log(formatStorageBackupPlan(plan));

  if (!plan.ok) {
    process.exitCode = 1;
    return;
  }

  mkdirSync(plan.backupDir, { recursive: true });

  const downloadedObjects: StorageObjectEntry[] = [];

  for (const object of objects) {
    const { data, error } = await client.storage.from(plan.bucket).download(object.path);

    if (error) {
      throw new Error(`下载 Storage 对象失败：${object.path}：${error.message}`);
    }

    const bytes = Buffer.from(await data.arrayBuffer());
    const localFilePath = resolveStorageBackupFilePath(plan.backupDir, object.localPath);
    mkdirSync(dirname(localFilePath), { recursive: true });
    writeFileSync(localFilePath, bytes);
    downloadedObjects.push({ ...object, size: bytes.byteLength });
  }

  const manifest = buildStorageBackupManifest({
    backupId: plan.backupId,
    bucket: plan.bucket,
    objects: downloadedObjects,
    supabaseUrl: config.supabaseUrl,
    warnings: plan.warnings,
  });
  writeFileSync(plan.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Storage manifest 已写入：${plan.manifestPath}`);
  console.log(`Storage 对象备份完成：${downloadedObjects.length} 个对象，清单文件 ${STORAGE_BACKUP_MANIFEST_FILE}`);
}

async function listStorageObjects(client: SupabaseClient, bucket: string): Promise<StorageObjectEntry[]> {
  const objects = await listStorageObjectsInPrefix(client, bucket, "");

  return objects.sort((left, right) => left.path.localeCompare(right.path));
}

async function listStorageObjectsInPrefix(
  client: SupabaseClient,
  bucket: string,
  prefix: string,
): Promise<StorageObjectEntry[]> {
  const objects: StorageObjectEntry[] = [];
  const limit = 100;

  for (let offset = 0; ; offset += limit) {
    const { data, error } = await client.storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: {
        column: "name",
        order: "asc",
      },
    });

    if (error) {
      throw new Error(`列出 Storage 对象失败：${prefix || "/"}：${error.message}`);
    }

    const items = (data ?? []) as ListedStorageItem[];

    for (const item of items) {
      const objectPath = prefix ? `${prefix}/${item.name}` : item.name;

      if (isStorageFolderEntry(item)) {
        objects.push(...await listStorageObjectsInPrefix(client, bucket, objectPath));
        continue;
      }

      objects.push(buildStorageObjectEntry({
        bucket,
        item,
        objectPath,
      }));
    }

    if (items.length < limit) {
      break;
    }
  }

  return objects;
}

function createSupabaseClient(supabaseUrl: string, serviceRoleKey: string): SupabaseClient {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
