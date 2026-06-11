import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export type TenantIsolationInventory = {
  files: Record<string, string>;
  migrationFiles: string[];
};

export type TenantIsolationCheck = {
  id: string;
  title: string;
  ok: boolean;
  evidence: string[];
  missing: string[];
};

export type TenantIsolationReadiness = {
  app: "lexos";
  ok: boolean;
  generatedAt: string;
  checks: TenantIsolationCheck[];
  blockers: string[];
  warnings: string[];
};

export const tenantScopedTables = [
  "ranks",
  "organization_members",
  "customers",
  "matters",
  "tasks",
  "task_claims",
  "task_milestones",
  "task_deliverables",
  "customer_portal_links",
  "customer_feedback",
  "settlements",
  "audit_logs",
  "system_settings",
  "risk_cases",
  "fund_transactions",
] as const;

const globalTables = [
  "organizations",
  "profiles",
  "roles",
  "customer_verification_codes",
] as const;

const apiRouteScopes = [
  { file: "app/api/users/route.ts", markers: ["session.organizationId", ".eq(\"organization_id\""] },
  { file: "app/api/customers/route.ts", markers: ["session.organizationId", "organization_id: session.organizationId"] },
  { file: "app/api/tasks/route.ts", markers: ["session.organizationId", ".eq(\"organization_id\""] },
  { file: "app/api/settlements/route.ts", markers: ["session.organizationId", ".eq(\"organization_id\""] },
  { file: "app/api/funds/route.ts", markers: ["session.organizationId", ".eq(\"organization_id\""] },
  { file: "app/api/risk-cases/route.ts", markers: ["session.organizationId", ".eq(\"organization_id\""] },
  { file: "app/api/audit-logs/route.ts", markers: ["session.organizationId", ".eq(\"organization_id\""] },
  { file: "app/api/system-settings/route.ts", markers: ["session.organizationId", "organization_id: session.organizationId"] },
  { file: "app/api/customer-portal/[token]/feedback/route.ts", markers: ["link.organization_id"] },
  { file: "app/api/customer-portal/[token]/deliverables/[deliverableId]/download/route.ts", markers: ["link.organization_id"] },
] as const;

const storageFiles = [
  { file: "src/lib/deliverables/files.ts", markers: ["organizationId", "input.organizationId"] },
] as const;

export function readTenantIsolationInventory(cwd = process.cwd()): TenantIsolationInventory {
  const migrationDir = path.join(cwd, "supabase", "migrations");
  const migrationFiles = existsSync(migrationDir)
    ? readdirSync(migrationDir).filter((fileName) => fileName.endsWith(".sql")).sort()
    : [];
  const filePaths = [
    ...apiRouteScopes.map((item) => item.file),
    ...storageFiles.map((item) => item.file),
    ...migrationFiles.map((fileName) => path.posix.join("supabase/migrations", fileName)),
  ];
  const files = Object.fromEntries(filePaths.map((relativePath) => {
    const absolutePath = path.join(cwd, ...relativePath.split("/"));

    return [
      relativePath,
      existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : "",
    ];
  }));

  return {
    files,
    migrationFiles,
  };
}

export function buildTenantIsolationReadiness(options: {
  generatedAt?: Date;
  inventory: TenantIsolationInventory;
}): TenantIsolationReadiness {
  const checks = [
    buildTenantTableCheck(options.inventory),
    buildApiRouteCheck(options.inventory),
    buildStoragePathCheck(options.inventory),
    buildGlobalTableCheck(options.inventory),
  ];
  const blockers = checks.flatMap((check) => check.ok ? [] : [`${check.title} 未通过：${check.missing.join(", ")}。`]);
  const warnings = [
    "本检查只读取本地迁移和关键 API 文件，不连接线上 Supabase，不查询真实租户数据。",
    "当前仍是单默认组织交付形态；正式多律所上线前需设计组织创建、租户管理员初始化、跨组织数据迁移和验收库隔离测试。",
  ];

  return {
    app: "lexos",
    ok: blockers.length === 0,
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    checks,
    blockers,
    warnings,
  };
}

export function formatTenantIsolationReadiness(readiness: TenantIsolationReadiness): string {
  const lines = [
    "# Lexos 多律所租户隔离核对",
    "",
    `生成时间：${readiness.generatedAt}`,
    `总体状态：${readiness.ok ? "可进入人工租户隔离核对" : "存在阻断项"}`,
    "",
    formatIssues("阻断项", readiness.blockers),
    formatIssues("提示", readiness.warnings),
    "",
    "## 核对项",
    ...readiness.checks.flatMap((check) => [
      "",
      `### ${check.title}`,
      `- 状态：${check.ok ? "通过" : "未通过"}`,
      `- 证据：${check.evidence.join("；") || "无"}`,
      ...(check.missing.length ? [`- 缺失：${check.missing.join("；")}`] : []),
    ]),
  ].filter((line) => line !== undefined);

  return lines.join("\n").trimEnd();
}

function buildTenantTableCheck(inventory: TenantIsolationInventory): TenantIsolationCheck {
  const migrationText = readMigrationText(inventory);
  const missing = tenantScopedTables.filter((tableName) => {
    return !hasTenantScopedTable(migrationText, tableName);
  });

  return {
    id: "tenant-tables",
    title: "租户数据表 organization_id 边界",
    ok: missing.length === 0,
    evidence: [`已核对 ${tenantScopedTables.length} 张租户表`],
    missing,
  };
}

function buildApiRouteCheck(inventory: TenantIsolationInventory): TenantIsolationCheck {
  const missing = apiRouteScopes
    .filter((scope) => !scope.markers.every((marker) => inventory.files[scope.file]?.includes(marker)))
    .map((scope) => scope.file);

  return {
    id: "api-routes",
    title: "关键 API 组织过滤",
    ok: missing.length === 0,
    evidence: [`已核对 ${apiRouteScopes.length} 个关键 API 文件`],
    missing,
  };
}

function buildStoragePathCheck(inventory: TenantIsolationInventory): TenantIsolationCheck {
  const missing = storageFiles
    .filter((scope) => !scope.markers.every((marker) => inventory.files[scope.file]?.includes(marker)))
    .map((scope) => scope.file);

  return {
    id: "storage-path",
    title: "Storage 对象路径组织隔离",
    ok: missing.length === 0,
    evidence: ["交付附件对象路径包含 organizationId"],
    missing,
  };
}

function buildGlobalTableCheck(inventory: TenantIsolationInventory): TenantIsolationCheck {
  const migrationText = readMigrationText(inventory);
  const missing = globalTables.filter((tableName) => {
    const createPattern = new RegExp(`create\\s+table(?:\\s+if\\s+not\\s+exists)?\\s+public\\.${tableName}\\b`, "i");

    return !createPattern.test(migrationText);
  });

  return {
    id: "global-tables",
    title: "全局表清单确认",
    ok: missing.length === 0,
    evidence: [`全局表：${globalTables.join(", ")}`],
    missing,
  };
}

function readMigrationText(inventory: TenantIsolationInventory): string {
  return inventory.migrationFiles
    .map((fileName) => inventory.files[path.posix.join("supabase/migrations", fileName)] ?? "")
    .join("\n\n");
}

function hasTenantScopedTable(migrationText: string, tableName: string): boolean {
  const escapedTableName = escapeRegExp(tableName);
  const createBlockPattern = new RegExp(
    `create\\s+table(?:\\s+if\\s+not\\s+exists)?\\s+public\\.${escapedTableName}\\b[\\s\\S]*?;`,
    "i",
  );
  const alterAddColumnPattern = new RegExp(
    `alter\\s+table\\s+public\\.${escapedTableName}\\b[\\s\\S]*?(?:add\\s+column\\s+)?organization_id\\b`,
    "i",
  );
  const createBlock = migrationText.match(createBlockPattern)?.[0] ?? "";

  return /\borganization_id\b/i.test(createBlock) || alterAddColumnPattern.test(migrationText);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatIssues(title: string, issues: string[]): string | undefined {
  if (!issues.length) {
    return undefined;
  }

  return [
    `${title}：`,
    ...issues.map((issue) => `- ${issue}`),
  ].join("\n");
}
