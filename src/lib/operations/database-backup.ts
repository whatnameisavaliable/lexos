import path from "node:path";

export const DEFAULT_DATABASE_BACKUP_SCHEMAS = ["public", "auth", "storage"] as const;
export const DATABASE_RESTORE_CONFIRMATION = "RESTORE_LEXOS_DATABASE";
export const DATABASE_BACKUP_MANIFEST_FILE = "manifest.json";

export type DatabaseBackupManifest = {
  version: 1;
  app: "lexos";
  kind: "postgres-logical-backup";
  backupId: string;
  createdAt: string;
  source: {
    databaseUrl: string;
    schemas: string[];
  };
  files: Array<{
    label: "schema" | "data" | "roles";
    path: string;
  }>;
  warnings: string[];
};

export type ShellCommandPlan = {
  label: string;
  command: string;
  args: string[];
  display: string;
  outputFile?: string;
};

export type DatabaseBackupPlan = {
  ok: boolean;
  backupId: string;
  backupDir: string;
  manifestPath: string;
  dryRun: boolean;
  databaseUrlConfigured: boolean;
  redactedDatabaseUrl: string;
  schemas: string[];
  files: {
    schema: string;
    data: string;
    roles: string;
  };
  commands: ShellCommandPlan[];
  manifest: DatabaseBackupManifest;
  blockers: string[];
  warnings: string[];
};

export type DatabaseRestorePlan = {
  ok: boolean;
  backupDir: string;
  dryRun: boolean;
  executeRequested: boolean;
  applyRoles: boolean;
  databaseUrlConfigured: boolean;
  redactedDatabaseUrl: string;
  manifest?: DatabaseBackupManifest;
  missingFiles: string[];
  commands: ShellCommandPlan[];
  blockers: string[];
  warnings: string[];
};

export type RestorePlanInput = {
  backupDir: string;
  databaseUrl?: string;
  manifest?: DatabaseBackupManifest;
  existingFiles: string[];
  executeRequested?: boolean;
  confirmation?: string;
  applyRoles?: boolean;
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

const schemaNamePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export function getDatabaseUrlFromEnv(env: NodeJS.ProcessEnv = process.env): string {
  return env.LEXOS_DATABASE_URL ?? env.SUPABASE_DB_URL ?? env.DATABASE_URL ?? "";
}

export function getDatabaseBackupSchemas(env: NodeJS.ProcessEnv = process.env): string[] {
  return parseBackupSchemas(env.LEXOS_BACKUP_SCHEMAS);
}

export function parseBackupSchemas(value?: string): string[] {
  const rawSchemas = value
    ? value.split(",").map((schema) => schema.trim()).filter(Boolean)
    : [...DEFAULT_DATABASE_BACKUP_SCHEMAS];
  const uniqueSchemas = Array.from(new Set(rawSchemas));

  return uniqueSchemas.filter((schema) => schemaNamePattern.test(schema));
}

export function createDatabaseBackupId(now = new Date()): string {
  const formatted = backupTimestampFormatter
    .format(now)
    .replace(" ", "-")
    .replaceAll("-", "")
    .replaceAll(":", "");

  return `lexos-db-${formatted}`;
}

export function redactDatabaseUrl(databaseUrl?: string): string {
  if (!databaseUrl) {
    return "";
  }

  try {
    const parsed = new URL(databaseUrl);

    if (parsed.username) {
      parsed.username = "***";
    }

    if (parsed.password) {
      parsed.password = "***";
    }

    return parsed.toString();
  } catch {
    return "[无法解析的数据库连接串]";
  }
}

export function buildDatabaseBackupPlan(options: {
  backupRoot?: string;
  backupId?: string;
  databaseUrl?: string;
  schemas?: string[];
  dryRun?: boolean;
  now?: Date;
}): DatabaseBackupPlan {
  const backupId = options.backupId ?? createDatabaseBackupId(options.now);
  const backupRoot = options.backupRoot ?? "backups";
  const backupDir = path.join(backupRoot, backupId);
  const databaseUrl = options.databaseUrl ?? "";
  const schemas = options.schemas?.length ? options.schemas : [...DEFAULT_DATABASE_BACKUP_SCHEMAS];
  const dryRun = options.dryRun ?? false;
  const files = {
    schema: path.join(backupDir, "schema.sql"),
    data: path.join(backupDir, "data.sql"),
    roles: path.join(backupDir, "roles.sql"),
  };
  const blockers: string[] = [];
  const warnings = buildBackupWarnings(schemas);

  if (!databaseUrl && !dryRun) {
    blockers.push("缺少数据库连接串。请设置 LEXOS_DATABASE_URL，或使用 LEXOS_BACKUP_DRY_RUN=true 只生成演练计划。");
  }

  if (!schemas.length) {
    blockers.push("备份 schema 为空。请检查 LEXOS_BACKUP_SCHEMAS，默认建议 public,auth,storage。");
  }

  const commands = [
    buildSupabaseDumpCommand("schema", databaseUrl, files.schema, schemas, dryRun, []),
    buildSupabaseDumpCommand("data", databaseUrl, files.data, schemas, dryRun, ["--data-only", "--use-copy"]),
    buildSupabaseDumpCommand("roles", databaseUrl, files.roles, [], dryRun, ["--role-only"]),
  ];
  const manifest: DatabaseBackupManifest = {
    version: 1,
    app: "lexos",
    kind: "postgres-logical-backup",
    backupId,
    createdAt: (options.now ?? new Date()).toISOString(),
    source: {
      databaseUrl: redactDatabaseUrl(databaseUrl),
      schemas,
    },
    files: [
      { label: "schema", path: "schema.sql" },
      { label: "data", path: "data.sql" },
      { label: "roles", path: "roles.sql" },
    ],
    warnings,
  };

  return {
    ok: blockers.length === 0,
    backupId,
    backupDir,
    manifestPath: path.join(backupDir, DATABASE_BACKUP_MANIFEST_FILE),
    dryRun,
    databaseUrlConfigured: Boolean(databaseUrl),
    redactedDatabaseUrl: redactDatabaseUrl(databaseUrl),
    schemas,
    files,
    commands,
    manifest,
    blockers,
    warnings,
  };
}

export function buildDatabaseRestorePlan(input: RestorePlanInput): DatabaseRestorePlan {
  const databaseUrl = input.databaseUrl ?? "";
  const executeRequested = input.executeRequested ?? false;
  const dryRun = !executeRequested;
  const applyRoles = input.applyRoles ?? false;
  const requiredFiles = [
    DATABASE_BACKUP_MANIFEST_FILE,
    "schema.sql",
    "data.sql",
  ];
  const missingFiles = requiredFiles.filter((fileName) => !input.existingFiles.includes(fileName));
  const blockers: string[] = [];
  const warnings = [
    "恢复脚本默认面向空库或新建验收库；对已有库执行前必须先完成备份、维护窗口和人工审批。",
    "数据库逻辑备份不包含 Supabase Storage 对象本体；附件对象需要按 bucket 单独备份和恢复。",
  ];

  if (!input.backupDir) {
    blockers.push("缺少备份目录。请设置 LEXOS_RESTORE_BACKUP_DIR，或传入 --backup-dir=backups/lexos-db-xxxx。");
  }

  if (missingFiles.length) {
    blockers.push(`备份目录缺少必要文件：${missingFiles.join(", ")}。`);
  }

  if (!databaseUrl && executeRequested) {
    blockers.push("执行恢复前必须设置 LEXOS_DATABASE_URL。");
  }

  if (executeRequested && input.confirmation !== DATABASE_RESTORE_CONFIRMATION) {
    blockers.push(`执行恢复前必须设置 LEXOS_RESTORE_CONFIRM=${DATABASE_RESTORE_CONFIRMATION}。`);
  }

  if (applyRoles && !input.existingFiles.includes("roles.sql")) {
    blockers.push("已请求恢复 roles.sql，但备份目录不存在 roles.sql。");
  }

  if (!applyRoles) {
    warnings.push("默认不会恢复 roles.sql；Supabase 自定义角色密码需要按官方说明单独重置或人工处理。");
  }

  const commands = [
    ...(applyRoles ? [buildPsqlCommand("roles", databaseUrl, path.join(input.backupDir, "roles.sql"))] : []),
    buildPsqlCommand("schema", databaseUrl, path.join(input.backupDir, "schema.sql")),
    buildPsqlCommand("data", databaseUrl, path.join(input.backupDir, "data.sql")),
  ];

  return {
    ok: blockers.length === 0,
    backupDir: input.backupDir,
    dryRun,
    executeRequested,
    applyRoles,
    databaseUrlConfigured: Boolean(databaseUrl),
    redactedDatabaseUrl: redactDatabaseUrl(databaseUrl),
    manifest: input.manifest,
    missingFiles,
    commands,
    blockers,
    warnings,
  };
}

export function formatDatabaseBackupPlan(plan: DatabaseBackupPlan): string {
  return [
    `Lexos 数据库备份计划：${plan.ok ? "可执行" : "未通过"}`,
    `备份目录：${plan.backupDir}`,
    `运行模式：${plan.dryRun ? "演练" : "执行"}`,
    `数据库连接串：${plan.databaseUrlConfigured ? plan.redactedDatabaseUrl : "未配置"}`,
    `备份 schema：${plan.schemas.join(", ")}`,
    formatIssues("阻断项", plan.blockers),
    formatIssues("提示", plan.warnings),
    "将执行命令：",
    ...plan.commands.map((command) => `- ${command.display}`),
  ].filter(Boolean).join("\n");
}

export function formatDatabaseRestorePlan(plan: DatabaseRestorePlan): string {
  return [
    `Lexos 数据库恢复计划：${plan.ok ? "可执行" : "未通过"}`,
    `备份目录：${plan.backupDir || "未配置"}`,
    `运行模式：${plan.dryRun ? "演练" : "执行"}`,
    `数据库连接串：${plan.databaseUrlConfigured ? plan.redactedDatabaseUrl : "未配置"}`,
    `恢复 roles.sql：${plan.applyRoles ? "是" : "否"}`,
    formatIssues("阻断项", plan.blockers),
    formatIssues("提示", plan.warnings),
    "将执行命令：",
    ...plan.commands.map((command) => `- ${command.display}`),
  ].filter(Boolean).join("\n");
}

function buildBackupWarnings(schemas: string[]): string[] {
  const warnings = [
    "数据库逻辑备份不包含 Supabase Storage 对象本体；交付附件需要按 bucket 单独备份。",
    "备份文件可能包含客户资料、案件信息、Auth 用户和敏感业务数据，必须离线加密保存并限制访问。",
  ];

  if (schemas.includes("auth")) {
    warnings.push("已包含 auth schema；恢复后如使用自定义角色或外部认证配置，仍需人工复核密码和认证设置。");
  }

  return warnings;
}

function buildSupabaseDumpCommand(
  label: "schema" | "data" | "roles",
  databaseUrl: string,
  outputFile: string,
  schemas: string[],
  dryRun: boolean,
  extraArgs: string[],
): ShellCommandPlan {
  const args = ["db", "dump", "--file", outputFile, ...extraArgs];

  if (databaseUrl) {
    args.splice(2, 0, "--db-url", databaseUrl);
  }

  if (schemas.length) {
    args.push("--schema", schemas.join(","));
  }

  if (dryRun) {
    args.push("--dry-run");
  }

  return {
    label,
    command: "supabase",
    args,
    display: buildDisplayCommand("supabase", args, databaseUrl),
    outputFile,
  };
}

function buildPsqlCommand(label: string, databaseUrl: string, filePath: string): ShellCommandPlan {
  const args = [
    "--set",
    "ON_ERROR_STOP=1",
    "--single-transaction",
    "--file",
    filePath,
    databaseUrl,
  ];

  return {
    label,
    command: "psql",
    args,
    display: buildDisplayCommand("psql", args, databaseUrl),
  };
}

function buildDisplayCommand(command: string, args: string[], databaseUrl: string): string {
  const redactedArgs = args.map((arg) => (arg === databaseUrl ? redactDatabaseUrl(databaseUrl) : arg));

  return [command, ...redactedArgs].join(" ");
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
