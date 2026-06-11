export const BACKUP_ENCRYPTION_PLAN_KIND = "lexos-backup-encryption-plan";
export const DEFAULT_BACKUP_ENCRYPTION_METHOD = "manual";
export const DEFAULT_ENCRYPTED_BACKUP_DIR = "backups/encrypted";
export const DEFAULT_BACKUP_COPY_COUNT = 2;

export type BackupEncryptionMethod = "age" | "gpg" | "7z" | "manual";

export type BackupEncryptionPlan = {
  version: 1;
  app: "lexos";
  kind: typeof BACKUP_ENCRYPTION_PLAN_KIND;
  generatedAt: string;
  backupRoot: string;
  encryptedArchiveDir: string;
  method: BackupEncryptionMethod;
  keyReference: string;
  copyCount: number;
  offsiteCopyRequired: boolean;
  commands: string[];
  checklist: string[];
  blockers: string[];
  warnings: string[];
};

const supportedMethods = new Set<BackupEncryptionMethod>(["age", "gpg", "7z", "manual"]);
const publicDirectoryPattern = /(^|[\\/])(?:public|\.next|out|app)([\\/]|$)/i;
const secretLikeKeyPattern = /(?:BEGIN .*PRIVATE KEY|PRIVATE KEY|PASSPHRASE|SECRET=|SERVICE_ROLE|DATABASE_URL)/i;

export function getBackupEncryptionConfigFromEnv(env: NodeJS.ProcessEnv = process.env): {
  backupRoot: string;
  encryptedArchiveDir: string;
  method: BackupEncryptionMethod;
  keyReference: string;
  copyCount: number;
  offsiteCopyRequired: boolean;
} {
  return {
    backupRoot: env.LEXOS_BACKUP_DIR || "backups",
    encryptedArchiveDir: env.LEXOS_BACKUP_ENCRYPTED_DIR || DEFAULT_ENCRYPTED_BACKUP_DIR,
    method: parseBackupEncryptionMethod(env.LEXOS_BACKUP_ENCRYPTION_METHOD),
    keyReference: env.LEXOS_BACKUP_ENCRYPTION_KEY_REF || "",
    copyCount: parsePositiveInteger(env.LEXOS_BACKUP_ENCRYPTED_COPY_COUNT, DEFAULT_BACKUP_COPY_COUNT),
    offsiteCopyRequired: env.LEXOS_BACKUP_OFFSITE_COPY_REQUIRED !== "false",
  };
}

export function parseBackupEncryptionMethod(value?: string): BackupEncryptionMethod {
  const normalized = value?.trim().toLowerCase();

  return normalized && supportedMethods.has(normalized as BackupEncryptionMethod)
    ? normalized as BackupEncryptionMethod
    : DEFAULT_BACKUP_ENCRYPTION_METHOD;
}

export function buildBackupEncryptionPlan(options: {
  backupRoot?: string;
  copyCount?: number;
  encryptedArchiveDir?: string;
  generatedAt?: Date;
  keyReference?: string;
  method?: BackupEncryptionMethod;
  offsiteCopyRequired?: boolean;
} = {}): BackupEncryptionPlan {
  const backupRoot = options.backupRoot || "backups";
  const encryptedArchiveDir = options.encryptedArchiveDir || DEFAULT_ENCRYPTED_BACKUP_DIR;
  const method = options.method || DEFAULT_BACKUP_ENCRYPTION_METHOD;
  const keyReference = options.keyReference?.trim() || "";
  const copyCount = options.copyCount ?? DEFAULT_BACKUP_COPY_COUNT;
  const offsiteCopyRequired = options.offsiteCopyRequired ?? true;
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (copyCount < 2) {
    blockers.push("离线加密备份至少需要 2 份副本：一份本地受控介质，一份异地或离线介质。");
  }

  if (publicDirectoryPattern.test(encryptedArchiveDir)) {
    blockers.push("加密备份归档目录不能位于 public、.next、out 或 app 等可能被构建或静态服务暴露的目录。");
  }

  if (keyReference && secretLikeKeyPattern.test(keyReference)) {
    blockers.push("LEXOS_BACKUP_ENCRYPTION_KEY_REF 只能填写密钥标识或保管位置，不能填写私钥、口令、service role 或数据库连接串。");
  }

  if (method === "manual") {
    warnings.push("当前使用 manual 加密方式；上线前需由律所运维明确 age、gpg、7z 或等效离线加密工具。");
  }

  if (!keyReference) {
    warnings.push("未配置加密密钥标识；正式交付时应记录密钥保管人、轮换周期和恢复授权流程。");
  }

  if (!offsiteCopyRequired) {
    warnings.push("已关闭异地副本要求；正式生产环境建议至少保留一份离线或异地加密副本。");
  }

  return {
    version: 1,
    app: "lexos",
    kind: BACKUP_ENCRYPTION_PLAN_KIND,
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    backupRoot,
    encryptedArchiveDir,
    method,
    keyReference,
    copyCount,
    offsiteCopyRequired,
    commands: buildEncryptionCommandExamples(method, backupRoot, encryptedArchiveDir, keyReference),
    checklist: buildBackupEncryptionChecklist(),
    blockers,
    warnings,
  };
}

export function formatBackupEncryptionPlan(plan: BackupEncryptionPlan): string {
  return [
    `Lexos 备份离线加密核对：${plan.blockers.length ? "未通过" : "可进入人工加密交接"}`,
    `生成时间：${plan.generatedAt}`,
    `备份根目录：${plan.backupRoot}`,
    `加密归档目录：${plan.encryptedArchiveDir}`,
    `加密方式：${plan.method}`,
    `密钥标识：${plan.keyReference || "未配置"}`,
    `加密副本数量：${plan.copyCount}`,
    `要求异地副本：${plan.offsiteCopyRequired ? "是" : "否"}`,
    formatIssues("阻断项", plan.blockers),
    formatIssues("提示", plan.warnings),
    "命令示例：",
    ...plan.commands.map((command) => `- ${command}`),
    "人工清单：",
    ...plan.checklist.map((item) => `- ${item}`),
  ].filter(Boolean).join("\n");
}

function buildEncryptionCommandExamples(
  method: BackupEncryptionMethod,
  backupRoot: string,
  encryptedArchiveDir: string,
  keyReference: string,
): string[] {
  if (method === "age") {
    return [
      `age --recipient ${keyReference || "<recipient>"} --output "${encryptedArchiveDir}/lexos-backup.tar.gz.age" "${backupRoot}/lexos-backup.tar.gz"`,
      `age --decrypt --identity "<identity-file>" --output "restore/lexos-backup.tar.gz" "${encryptedArchiveDir}/lexos-backup.tar.gz.age"`,
    ];
  }

  if (method === "gpg") {
    return [
      `gpg --encrypt --recipient ${keyReference || "<recipient>"} --output "${encryptedArchiveDir}/lexos-backup.tar.gz.gpg" "${backupRoot}/lexos-backup.tar.gz"`,
      `gpg --decrypt --output "restore/lexos-backup.tar.gz" "${encryptedArchiveDir}/lexos-backup.tar.gz.gpg"`,
    ];
  }

  if (method === "7z") {
    return [
      `7z a -t7z -mhe=on "${encryptedArchiveDir}/lexos-backup.7z" "${backupRoot}"`,
      `7z x "${encryptedArchiveDir}/lexos-backup.7z" -orestore`,
    ];
  }

  return [
    `先完成 npm.cmd run backup:db 与 npm.cmd run backup:storage，再由运维使用律所指定工具加密 ${backupRoot}。`,
    `加密完成后将归档放入 ${encryptedArchiveDir}，并记录校验值、执行人和密钥保管信息。`,
  ];
}

function buildBackupEncryptionChecklist(): string[] {
  return [
    "数据库备份和 Storage 对象备份来自同一业务时间窗口。",
    "加密前已生成 backup:rehearsal 报告，且必要文件齐全。",
    "加密后记录归档文件 SHA-256、大小、备份时间、执行人和复核人。",
    "私钥、口令或恢复介质不进入 Git、工单截图、README 或公开日志。",
    "至少保留一份离线或异地加密副本，并定期抽样解密演练。",
    "恢复演练先在隔离环境解密，再执行 restore:db、restore:storage、verify:rls 和真实闭环 smoke。",
  ];
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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
