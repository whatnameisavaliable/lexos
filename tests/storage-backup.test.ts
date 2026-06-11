import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";

import {
  buildStorageBackupManifest,
  buildStorageBackupObjectLocalPath,
  buildStorageBackupPlan,
  buildStorageObjectEntry,
  buildStorageRestorePlan,
  isStorageFolderEntry,
  resolveStorageBackupFilePath,
  STORAGE_BACKUP_MANIFEST_FILE,
  STORAGE_RESTORE_CONFIRMATION,
  type StorageBackupManifest,
  type StorageObjectEntry,
} from "../src/lib/operations/storage-backup.ts";

const supabaseUrl = "https://example.supabase.co";
const serviceRoleKey = "service-role-key";

function storageObject(pathName: string, size = 128): StorageObjectEntry {
  return {
    bucket: "lexos-deliverables",
    localPath: buildStorageBackupObjectLocalPath(pathName),
    path: pathName,
    size,
  };
}

function storageManifest(objects: StorageObjectEntry[] = [storageObject("org/task/file.pdf")]): StorageBackupManifest {
  return buildStorageBackupManifest({
    backupId: "lexos-storage-test",
    bucket: "lexos-deliverables",
    objects,
    supabaseUrl,
  });
}

describe("Storage 备份计划", () => {
  it("演练模式不要求 Supabase URL 和 service role", () => {
    const plan = buildStorageBackupPlan({
      backupId: "lexos-storage-test",
      dryRun: true,
      serviceRoleKey: "",
      supabaseUrl: "",
    });

    assert.equal(plan.ok, true);
    assert.equal(plan.dryRun, true);
    assert.equal(plan.bucket, "lexos-deliverables");
  });

  it("执行模式缺少 Supabase URL 或 service role 时阻断", () => {
    const plan = buildStorageBackupPlan({
      backupId: "lexos-storage-test",
      dryRun: false,
      serviceRoleKey: "",
      supabaseUrl,
    });

    assert.equal(plan.ok, false);
    assert.equal(plan.blockers.some((blocker) => blocker.includes("SUPABASE_SERVICE_ROLE_KEY")), true);
  });

  it("Storage 对象本地路径会编码特殊字符并阻止目录穿越", () => {
    const localPath = buildStorageBackupObjectLocalPath("../客户:材料/合同?.pdf");

    assert.equal(localPath.startsWith("objects/"), true);
    assert.equal(localPath.includes(".."), false);
    assert.equal(localPath.includes(":"), false);

    const resolved = resolveStorageBackupFilePath("backups/lexos-storage-test", localPath);
    assert.equal(resolved.startsWith(path.resolve("backups/lexos-storage-test")), true);
    assert.throws(() => resolveStorageBackupFilePath("backups/lexos-storage-test", "../escape.txt"), /路径越界/);
  });

  it("manifest 会汇总对象数量和实际字节数", () => {
    const manifest = storageManifest([
      storageObject("org/task/a.pdf", 100),
      storageObject("org/task/b.zip", 300),
    ]);

    assert.equal(manifest.objectCount, 2);
    assert.equal(manifest.totalBytes, 400);
    assert.deepEqual(manifest.objects.map((object) => object.path), [
      "org/task/a.pdf",
      "org/task/b.zip",
    ]);
  });

  it("可以从 Supabase Storage 列表条目生成对象清单", () => {
    const fileEntry = buildStorageObjectEntry({
      bucket: "lexos-deliverables",
      item: {
        created_at: "2026-06-10T08:00:00.000Z",
        id: "file-id",
        metadata: {
          eTag: "etag-1",
          mimetype: "application/pdf",
          size: 2048,
        },
        name: "deliverable.pdf",
        updated_at: "2026-06-10T08:01:00.000Z",
      },
      objectPath: "org/task/deliverable.pdf",
    });

    assert.equal(fileEntry.size, 2048);
    assert.equal(fileEntry.mimeType, "application/pdf");
    assert.equal(fileEntry.etag, "etag-1");
    assert.equal(isStorageFolderEntry({ id: null, metadata: null, name: "folder" }), true);
    assert.equal(isStorageFolderEntry({ id: "file-id", metadata: {}, name: "file.pdf" }), false);
  });
});

describe("Storage 恢复计划", () => {
  it("默认恢复计划只做演练，不要求确认口令", () => {
    const manifest = storageManifest();
    const plan = buildStorageRestorePlan({
      backupDir: "backups/lexos-storage-test",
      existingFiles: [
        STORAGE_BACKUP_MANIFEST_FILE,
        manifest.objects[0].localPath,
      ],
      manifest,
      serviceRoleKey: "",
      supabaseUrl: "",
    });

    assert.equal(plan.ok, true);
    assert.equal(plan.dryRun, true);
    assert.equal(plan.objectCount, 1);
  });

  it("执行恢复时必须显式设置确认口令", () => {
    const manifest = storageManifest();
    const plan = buildStorageRestorePlan({
      backupDir: "backups/lexos-storage-test",
      executeRequested: true,
      existingFiles: [
        STORAGE_BACKUP_MANIFEST_FILE,
        manifest.objects[0].localPath,
      ],
      manifest,
      serviceRoleKey,
      supabaseUrl,
    });

    assert.equal(plan.ok, false);
    assert.equal(plan.blockers.some((blocker) => blocker.includes(STORAGE_RESTORE_CONFIRMATION)), true);
  });

  it("缺少 manifest 或对象文件时阻断恢复演练", () => {
    const manifest = storageManifest([storageObject("org/task/missing.pdf")]);
    const plan = buildStorageRestorePlan({
      backupDir: "backups/lexos-storage-test",
      existingFiles: [STORAGE_BACKUP_MANIFEST_FILE],
      manifest,
      serviceRoleKey,
      supabaseUrl,
    });

    assert.equal(plan.ok, false);
    assert.deepEqual(plan.missingFiles, [manifest.objects[0].localPath]);

    const missingManifestPlan = buildStorageRestorePlan({
      backupDir: "backups/lexos-storage-test",
      existingFiles: [],
      serviceRoleKey,
      supabaseUrl,
    });

    assert.equal(missingManifestPlan.ok, false);
    assert.equal(missingManifestPlan.blockers.some((blocker) => blocker.includes(STORAGE_BACKUP_MANIFEST_FILE)), true);
  });

  it("执行恢复可显式允许覆盖同名对象", () => {
    const manifest = storageManifest();
    const plan = buildStorageRestorePlan({
      backupDir: "backups/lexos-storage-test",
      confirmation: STORAGE_RESTORE_CONFIRMATION,
      executeRequested: true,
      existingFiles: [
        STORAGE_BACKUP_MANIFEST_FILE,
        manifest.objects[0].localPath,
      ],
      manifest,
      serviceRoleKey,
      supabaseUrl,
      upsert: true,
    });

    assert.equal(plan.ok, true);
    assert.equal(plan.dryRun, false);
    assert.equal(plan.upsert, true);
  });
});
