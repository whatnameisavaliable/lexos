import path from "node:path";

import { DELIVERABLE_BUCKET } from "../deliverables/files.ts";
import { normalizeSupabaseUrl } from "../supabase/url.ts";

export const DEFAULT_STORAGE_BACKUP_BUCKET = DELIVERABLE_BUCKET;
export const STORAGE_BACKUP_MANIFEST_FILE = "storage-manifest.json";
export const STORAGE_RESTORE_CONFIRMATION = "RESTORE_LEXOS_STORAGE";
export const STORAGE_BACKUP_OBJECTS_DIR = "objects";

export type StorageObjectEntry = {
  bucket: string;
  path: string;
  localPath: string;
  size: number;
  mimeType?: string;
  etag?: string;
  createdAt?: string;
  updatedAt?: string;
  lastAccessedAt?: string;
  metadata?: Record<string, unknown>;
};

export type StorageBackupManifest = {
  version: 1;
  app: "lexos";
  kind: "supabase-storage-backup";
  backupId: string;
  createdAt: string;
  source: {
    supabaseUrl: string;
    bucket: string;
  };
  objectCount: number;
  totalBytes: number;
  objects: StorageObjectEntry[];
  warnings: string[];
};

export type StorageBackupPlan = {
  ok: boolean;
  backupId: string;
  backupDir: string;
  manifestPath: string;
  dryRun: boolean;
  bucket: string;
  supabaseUrlConfigured: boolean;
  serviceRoleConfigured: boolean;
  objectCount: number;
  totalBytes: number;
  manifest: StorageBackupManifest;
  blockers: string[];
  warnings: string[];
};

export type StorageRestorePlan = {
  ok: boolean;
  backupDir: string;
  dryRun: boolean;
  executeRequested: boolean;
  bucket: string;
  upsert: boolean;
  supabaseUrlConfigured: boolean;
  serviceRoleConfigured: boolean;
  manifest?: StorageBackupManifest;
  objectCount: number;
  totalBytes: number;
  missingFiles: string[];
  blockers: string[];
  warnings: string[];
};

export type StorageRestorePlanInput = {
  backupDir: string;
  existingFiles: string[];
  manifest?: StorageBackupManifest;
  bucket?: string;
  supabaseUrl?: string;
  serviceRoleKey?: string;
  executeRequested?: boolean;
  confirmation?: string;
  upsert?: boolean;
};

export type ListedStorageItem = {
  name: string;
  id?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  last_accessed_at?: string | null;
  metadata?: Record<string, unknown> | null;
};

const backupTimestampFormatter = new Intl.DateTimeFormat("sv-SE", {
  day: "2-digit",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  month: "2-digit",
  second: "2-digit",
  timeZone: "Asia/Shanghai",
  year: "numeric",
});

export function getStorageBackupConfigFromEnv(env: NodeJS.ProcessEnv = process.env): {
  backupRoot: string;
  bucket: string;
  dryRun: boolean;
  serviceRoleKey: string;
  supabaseUrl: string;
} {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ? normalizeSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL) : "";

  return {
    backupRoot: env.LEXOS_STORAGE_BACKUP_DIR || env.LEXOS_BACKUP_DIR || "backups",
    bucket: env.LEXOS_STORAGE_BUCKET || DEFAULT_STORAGE_BACKUP_BUCKET,
    dryRun: env.LEXOS_STORAGE_BACKUP_DRY_RUN === "true",
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || "",
    supabaseUrl,
  };
}

export function getStorageRestoreConfigFromEnv(env: NodeJS.ProcessEnv = process.env): {
  backupDir: string;
  bucket: string;
  executeRequested: boolean;
  serviceRoleKey: string;
  supabaseUrl: string;
  upsert: boolean;
} {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ? normalizeSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL) : "";

  return {
    backupDir: env.LEXOS_STORAGE_RESTORE_BACKUP_DIR || "",
    bucket: env.LEXOS_STORAGE_BUCKET || DEFAULT_STORAGE_BACKUP_BUCKET,
    executeRequested: env.LEXOS_STORAGE_RESTORE_EXECUTE === "true",
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || "",
    supabaseUrl,
    upsert: env.LEXOS_STORAGE_RESTORE_UPSERT === "true",
  };
}

export function createStorageBackupId(now = new Date()): string {
  const formatted = backupTimestampFormatter
    .format(now)
    .replace(" ", "-")
    .replaceAll("-", "")
    .replaceAll(":", "");

  return `lexos-storage-${formatted}`;
}

export function buildStorageBackupPlan(options: {
  backupRoot?: string;
  backupId?: string;
  bucket?: string;
  dryRun?: boolean;
  now?: Date;
  objects?: StorageObjectEntry[];
  serviceRoleKey?: string;
  supabaseUrl?: string;
}): StorageBackupPlan {
  const backupId = options.backupId ?? createStorageBackupId(options.now);
  const backupRoot = options.backupRoot ?? "backups";
  const backupDir = path.join(backupRoot, backupId);
  const bucket = (options.bucket ?? DEFAULT_STORAGE_BACKUP_BUCKET).trim();
  const dryRun = options.dryRun ?? false;
  const supabaseUrl = options.supabaseUrl ? normalizeSupabaseUrl(options.supabaseUrl) : "";
  const serviceRoleKey = options.serviceRoleKey ?? "";
  const objects = options.objects ?? [];
  const warnings = buildStorageBackupWarnings(bucket);
  const blockers: string[] = [];

  if (!bucket) {
    blockers.push("Storage bucket 不能为空。请设置 LEXOS_STORAGE_BUCKET，默认使用 lexos-deliverables。");
  }

  if ((!supabaseUrl || !serviceRoleKey) && !dryRun) {
    blockers.push("执行 Storage 备份前必须配置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY，或使用 LEXOS_STORAGE_BACKUP_DRY_RUN=true 做演练。");
  }

  const manifest = buildStorageBackupManifest({
    backupId,
    bucket,
    now: options.now,
    objects,
    supabaseUrl,
    warnings,
  });

  return {
    ok: blockers.length === 0,
    backupId,
    backupDir,
    manifestPath: path.join(backupDir, STORAGE_BACKUP_MANIFEST_FILE),
    dryRun,
    bucket,
    supabaseUrlConfigured: Boolean(supabaseUrl),
    serviceRoleConfigured: Boolean(serviceRoleKey),
    objectCount: manifest.objectCount,
    totalBytes: manifest.totalBytes,
    manifest,
    blockers,
    warnings,
  };
}

export function buildStorageBackupManifest(options: {
  backupId: string;
  bucket: string;
  now?: Date;
  objects: StorageObjectEntry[];
  supabaseUrl?: string;
  warnings?: string[];
}): StorageBackupManifest {
  const objects = [...options.objects].sort((left, right) => left.path.localeCompare(right.path));
  const totalBytes = objects.reduce((sum, object) => sum + object.size, 0);

  return {
    version: 1,
    app: "lexos",
    kind: "supabase-storage-backup",
    backupId: options.backupId,
    createdAt: (options.now ?? new Date()).toISOString(),
    source: {
      supabaseUrl: options.supabaseUrl ? normalizeSupabaseUrl(options.supabaseUrl) : "",
      bucket: options.bucket,
    },
    objectCount: objects.length,
    totalBytes,
    objects,
    warnings: options.warnings ?? buildStorageBackupWarnings(options.bucket),
  };
}

export function buildStorageRestorePlan(input: StorageRestorePlanInput): StorageRestorePlan {
  const executeRequested = input.executeRequested ?? false;
  const dryRun = !executeRequested;
  const upsert = input.upsert ?? false;
  const supabaseUrl = input.supabaseUrl ? normalizeSupabaseUrl(input.supabaseUrl) : "";
  const serviceRoleKey = input.serviceRoleKey ?? "";
  const manifest = input.manifest;
  const bucket = (input.bucket || manifest?.source.bucket || DEFAULT_STORAGE_BACKUP_BUCKET).trim();
  const requiredFiles = [
    STORAGE_BACKUP_MANIFEST_FILE,
    ...(manifest?.objects.map((object) => object.localPath) ?? []),
  ];
  const missingFiles = requiredFiles.filter((fileName) => !input.existingFiles.includes(fileName));
  const blockers: string[] = [];
  const warnings = [
    "Storage 恢复脚本默认只做演练；正式执行前请先确认目标 bucket 已存在且处于私有模式。",
    "恢复对象可能覆盖同名文件；默认 upsert=false，如需覆盖必须显式设置 LEXOS_STORAGE_RESTORE_UPSERT=true 或传入 --upsert。",
  ];

  if (!input.backupDir) {
    blockers.push("缺少 Storage 备份目录。请设置 LEXOS_STORAGE_RESTORE_BACKUP_DIR，或传入 --backup-dir=backups/lexos-storage-xxxx。");
  }

  if (!manifest) {
    blockers.push(`备份目录缺少 ${STORAGE_BACKUP_MANIFEST_FILE}。`);
  }

  if (!bucket) {
    blockers.push("Storage bucket 不能为空。请设置 LEXOS_STORAGE_BUCKET，或确认 manifest 中包含来源 bucket。");
  }

  if (missingFiles.length) {
    blockers.push(`Storage 备份目录缺少必要文件：${missingFiles.join(", ")}。`);
  }

  if ((!supabaseUrl || !serviceRoleKey) && executeRequested) {
    blockers.push("执行 Storage 恢复前必须配置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY。");
  }

  if (executeRequested && input.confirmation !== STORAGE_RESTORE_CONFIRMATION) {
    blockers.push(`执行 Storage 恢复前必须设置 LEXOS_STORAGE_RESTORE_CONFIRM=${STORAGE_RESTORE_CONFIRMATION}。`);
  }

  return {
    ok: blockers.length === 0,
    backupDir: input.backupDir,
    dryRun,
    executeRequested,
    bucket,
    upsert,
    supabaseUrlConfigured: Boolean(supabaseUrl),
    serviceRoleConfigured: Boolean(serviceRoleKey),
    manifest,
    objectCount: manifest?.objectCount ?? 0,
    totalBytes: manifest?.totalBytes ?? 0,
    missingFiles,
    blockers,
    warnings,
  };
}

export function isStorageFolderEntry(item: ListedStorageItem): boolean {
  return item.id == null && item.metadata == null;
}

export function buildStorageObjectEntry(options: {
  bucket: string;
  item: ListedStorageItem;
  objectPath: string;
  sizeOverride?: number;
}): StorageObjectEntry {
  const metadata = options.item.metadata ?? undefined;
  const size = options.sizeOverride ?? readMetadataNumber(metadata, "size") ?? 0;
  const mimeType = readMetadataString(metadata, "mimetype") ?? readMetadataString(metadata, "mimeType");
  const etag = readMetadataString(metadata, "eTag") ?? readMetadataString(metadata, "etag");

  return removeUndefinedProperties({
    bucket: options.bucket,
    path: options.objectPath,
    localPath: buildStorageBackupObjectLocalPath(options.objectPath),
    size,
    mimeType,
    etag,
    createdAt: options.item.created_at ?? undefined,
    updatedAt: options.item.updated_at ?? undefined,
    lastAccessedAt: options.item.last_accessed_at ?? undefined,
    metadata,
  });
}

export function buildStorageBackupObjectLocalPath(objectPath: string): string {
  const segments = objectPath
    .replaceAll("\\", "/")
    .split("/")
    .map((segment) => encodeStoragePathSegment(segment));

  return path.posix.join(STORAGE_BACKUP_OBJECTS_DIR, ...segments);
}

export function encodeStoragePathSegment(segment: string): string {
  const encoded = encodeURIComponent(segment || "_").replace(/\./g, "%2E");

  return encoded || "_";
}

export function resolveStorageBackupFilePath(backupDir: string, relativePath: string): string {
  const backupRoot = path.resolve(backupDir);
  const resolved = path.resolve(backupRoot, ...relativePath.split(/[\\/]+/));

  if (resolved !== backupRoot && !resolved.startsWith(`${backupRoot}${path.sep}`)) {
    throw new Error(`Storage 备份文件路径越界：${relativePath}`);
  }

  return resolved;
}

export function formatStorageBackupPlan(plan: StorageBackupPlan): string {
  return [
    `Lexos Storage 备份计划：${plan.ok ? "可执行" : "未通过"}`,
    `备份目录：${plan.backupDir}`,
    `运行模式：${plan.dryRun ? "演练" : "执行"}`,
    `Bucket：${plan.bucket || "未配置"}`,
    `Supabase URL：${plan.supabaseUrlConfigured ? "已配置" : "未配置"}`,
    `Service role：${plan.serviceRoleConfigured ? "已配置" : "未配置"}`,
    `对象数量：${plan.objectCount}`,
    `对象总大小：${formatStorageBytes(plan.totalBytes)}`,
    formatIssues("阻断项", plan.blockers),
    formatIssues("提示", plan.warnings),
  ].filter(Boolean).join("\n");
}

export function formatStorageRestorePlan(plan: StorageRestorePlan): string {
  return [
    `Lexos Storage 恢复计划：${plan.ok ? "可执行" : "未通过"}`,
    `备份目录：${plan.backupDir || "未配置"}`,
    `运行模式：${plan.dryRun ? "演练" : "执行"}`,
    `目标 Bucket：${plan.bucket || "未配置"}`,
    `覆盖同名对象：${plan.upsert ? "是" : "否"}`,
    `Supabase URL：${plan.supabaseUrlConfigured ? "已配置" : "未配置"}`,
    `Service role：${plan.serviceRoleConfigured ? "已配置" : "未配置"}`,
    `对象数量：${plan.objectCount}`,
    `对象总大小：${formatStorageBytes(plan.totalBytes)}`,
    formatIssues("阻断项", plan.blockers),
    formatIssues("提示", plan.warnings),
  ].filter(Boolean).join("\n");
}

function buildStorageBackupWarnings(bucket: string): string[] {
  return [
    `Storage 备份只覆盖 ${bucket || DEFAULT_STORAGE_BACKUP_BUCKET} bucket 的对象本体；数据库元数据仍需要配合 npm run backup:db 单独备份。`,
    "交付附件可能包含客户资料、案件材料和律师成果文件，备份目录必须离线加密保存并限制访问。",
    "第一版脚本不做病毒扫描、离线加密、对象生命周期清理或跨云镜像调度。",
  ];
}

function readMetadataNumber(metadata: Record<string, unknown> | undefined, key: string): number | undefined {
  const value = metadata?.[key];

  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readMetadataString(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = metadata?.[key];

  return typeof value === "string" && value ? value : undefined;
}

function removeUndefinedProperties<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

function formatStorageBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatIssues(title: string, issues: string[]): string {
  if (!issues.length) {
    return "";
  }

  return [
    `${title}：`,
    ...issues.map((issue) => `- ${issue}`),
  ].join("\n");
}
