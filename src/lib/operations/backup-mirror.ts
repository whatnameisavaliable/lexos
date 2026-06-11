export const BACKUP_MIRROR_PLAN_KIND = "lexos-backup-mirror-plan";

export type BackupMirrorTarget = "manual-offsite" | "s3-compatible" | "nas" | "object-storage" | "offline-disk";

export type BackupMirrorRule = {
  id: string;
  title: string;
  requiredEvidence: string[];
  acceptance: string;
};

export type BackupMirrorPlan = {
  version: 1;
  app: "lexos";
  kind: typeof BACKUP_MIRROR_PLAN_KIND;
  generatedAt: string;
  owner: string;
  target: BackupMirrorTarget;
  destinationRef: string;
  minCopies: number;
  rpoHours: number;
  verifyIntervalDays: number;
  rules: BackupMirrorRule[];
  blockers: string[];
  warnings: string[];
};

const defaultOwner = "未指定";
const defaultDestinationRef = "未指定";
const allowedTargets = new Set<BackupMirrorTarget>([
  "manual-offsite",
  "s3-compatible",
  "nas",
  "object-storage",
  "offline-disk",
]);
const secretLikePattern = /(?:service_role|database_url|db_url|password|secret|token|private_key|access_key|credential|短信|sms)/i;

export const backupMirrorRules: BackupMirrorRule[] = [
  {
    id: "encrypted-before-mirror",
    title: "镜像前必须完成离线加密",
    requiredEvidence: ["加密方式", "密钥标识", "加密副本目录", "复核人"],
    acceptance: "只镜像加密后的数据库备份与 Storage 对象备份，不镜像明文导出目录。",
  },
  {
    id: "db-storage-same-window",
    title: "数据库与 Storage 备份时间窗口一致",
    requiredEvidence: ["数据库备份 ID", "Storage 备份 ID", "生成时间", "恢复演练报告 ID"],
    acceptance: "同一批镜像材料必须能映射到一次完整恢复演练报告。",
  },
  {
    id: "manifest-checksum-retained",
    title: "manifest 与校验值随镜像保留",
    requiredEvidence: ["manifest.json", "storage-manifest.json", "checksum 或对象数量摘要"],
    acceptance: "异地副本中保留文件清单、对象数量和校验摘要，便于抽检。",
  },
  {
    id: "offsite-access-boundary",
    title: "异地访问边界与凭据隔离",
    requiredEvidence: ["目的地标识", "访问审批记录", "最小权限说明", "凭据保管人"],
    acceptance: "核对清单只记录目的地标识，不记录访问密钥、连接串、token 或恢复口令。",
  },
  {
    id: "mirror-restore-verification",
    title: "异地副本恢复抽检",
    requiredEvidence: ["抽检日期", "抽检人", "恢复演练报告", "阻断项处理记录"],
    acceptance: "至少按配置周期从异地副本抽取一次恢复演练材料并归档。",
  },
];

export function getBackupMirrorConfigFromEnv(env: NodeJS.ProcessEnv = process.env): {
  destinationRef: string;
  minCopies: number;
  owner: string;
  rpoHours: number;
  target: BackupMirrorTarget;
  verifyIntervalDays: number;
} {
  return {
    destinationRef: env.LEXOS_BACKUP_MIRROR_DESTINATION_REF || defaultDestinationRef,
    minCopies: parsePositiveInteger(env.LEXOS_BACKUP_MIRROR_MIN_COPIES, 2),
    owner: env.LEXOS_BACKUP_MIRROR_OWNER || defaultOwner,
    rpoHours: parsePositiveInteger(env.LEXOS_BACKUP_MIRROR_RPO_HOURS, 24),
    target: parseBackupMirrorTarget(env.LEXOS_BACKUP_MIRROR_TARGET),
    verifyIntervalDays: parsePositiveInteger(env.LEXOS_BACKUP_MIRROR_VERIFY_INTERVAL_DAYS, 30),
  };
}

export function parseBackupMirrorTarget(value?: string): BackupMirrorTarget {
  const normalized = value?.trim();

  if (normalized && allowedTargets.has(normalized as BackupMirrorTarget)) {
    return normalized as BackupMirrorTarget;
  }

  return "manual-offsite";
}

export function buildBackupMirrorPlan(options: {
  destinationRef?: string;
  generatedAt?: Date;
  minCopies?: number;
  owner?: string;
  rpoHours?: number;
  target?: BackupMirrorTarget;
  verifyIntervalDays?: number;
} = {}): BackupMirrorPlan {
  const owner = options.owner?.trim() || defaultOwner;
  const destinationRef = options.destinationRef?.trim() || defaultDestinationRef;
  const minCopies = options.minCopies ?? 2;
  const rpoHours = options.rpoHours ?? 24;
  const verifyIntervalDays = options.verifyIntervalDays ?? 30;
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (owner === defaultOwner) {
    blockers.push("备份异地镜像必须指定责任人，请设置 LEXOS_BACKUP_MIRROR_OWNER。");
  }

  if (destinationRef === defaultDestinationRef) {
    blockers.push("备份异地镜像必须指定目的地标识，请设置 LEXOS_BACKUP_MIRROR_DESTINATION_REF。");
  }

  if (secretLikePattern.test(destinationRef)) {
    blockers.push("镜像目的地只能填写库房、桶、保险箱或离线介质标识，不能包含 token、secret、连接串、访问密钥或短信服务信息。");
  }

  if (minCopies < 2) {
    blockers.push("异地镜像副本数量不能小于 2 份，至少保留本地加密副本和异地副本。");
  }

  if (rpoHours > 48) {
    blockers.push("异地镜像 RPO 不能超过 48 小时，请缩短同步或人工搬运间隔。");
  }

  if (verifyIntervalDays > 90) {
    blockers.push("异地副本恢复抽检周期不能超过 90 天。");
  }

  warnings.push("本检查只生成备份异地/跨云镜像核对清单，不上传文件、不调用对象存储 SDK、不连接线上 Supabase。");
  warnings.push("镜像前应先完成 backup:encrypt:check、backup:rehearsal 和 backup:alert:check，避免把未加密或不可恢复材料带到异地。");

  return {
    version: 1,
    app: "lexos",
    kind: BACKUP_MIRROR_PLAN_KIND,
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    owner,
    target: options.target ?? "manual-offsite",
    destinationRef,
    minCopies,
    rpoHours,
    verifyIntervalDays,
    rules: backupMirrorRules,
    blockers,
    warnings,
  };
}

export function formatBackupMirrorPlan(plan: BackupMirrorPlan): string {
  return [
    `Lexos 备份异地/跨云镜像核对：${plan.blockers.length ? "未通过" : "可进入人工镜像交接"}`,
    `生成时间：${plan.generatedAt}`,
    `责任人：${plan.owner}`,
    `镜像类型：${plan.target}`,
    `目的地标识：${plan.destinationRef}`,
    `最少副本数：${plan.minCopies}`,
    `镜像 RPO：${plan.rpoHours} 小时`,
    `恢复抽检周期：${plan.verifyIntervalDays} 天`,
    formatIssues("阻断项", plan.blockers),
    formatIssues("提示", plan.warnings),
    "核对规则：",
    ...plan.rules.flatMap((rule) => [
      `- ${rule.title}：${rule.acceptance}`,
      `  证据：${rule.requiredEvidence.join("、")}`,
    ]),
  ].filter(Boolean).join("\n");
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
