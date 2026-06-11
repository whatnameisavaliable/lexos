import {
  buildPrivateDeploymentReadiness,
  readPrivateReadinessInventory,
  requiredPrivateMigrationFiles,
  type PrivateDeploymentReadiness,
  type PrivateReadinessInventory,
} from "./private-readiness.ts";

export type LaunchReadinessStageId =
  | "local-preflight"
  | "migration-check"
  | "storage-check"
  | "security-check"
  | "backup-rehearsal"
  | "smoke-check"
  | "handover";

export type LaunchReadinessItem = {
  id: string;
  title: string;
  required: boolean;
  readonly: boolean;
  command?: string;
  expectedEvidence: string;
  notes: string[];
};

export type LaunchReadinessStage = {
  id: LaunchReadinessStageId;
  title: string;
  items: LaunchReadinessItem[];
};

export type LaunchReadinessRunbook = {
  app: "lexos";
  ok: boolean;
  generatedAt: string;
  privateReadiness: PrivateDeploymentReadiness;
  migrationSummary: {
    required: number;
    present: number;
    missing: string[];
  };
  blockers: string[];
  warnings: string[];
  stages: LaunchReadinessStage[];
};

const requiredLaunchScripts = [
  "private:check",
  "verify",
  "deploy:channel:check",
  "deploy:upload:check",
  "deploy:preview:request",
  "deploy:preview:evidence",
  "verify:rls",
  "smoke:real",
  "backup:db",
  "backup:storage",
  "backup:schedule",
  "backup:task:check",
  "backup:run:check",
  "backup:rehearsal",
  "test:e2e",
] as const;

export function buildLaunchReadinessRunbook(options: {
  env?: NodeJS.ProcessEnv;
  generatedAt?: Date;
  inventory?: PrivateReadinessInventory;
} = {}): LaunchReadinessRunbook {
  const env = options.env ?? process.env;
  const inventory = options.inventory ?? readPrivateReadinessInventory();
  const privateReadiness = buildPrivateDeploymentReadiness(env, inventory);
  const missingMigrations = requiredPrivateMigrationFiles.filter((fileName) => !inventory.migrationFiles.includes(fileName));
  const missingScripts = requiredLaunchScripts.filter((scriptName) => !inventory.packageScripts.includes(scriptName));
  const blockers = [
    ...privateReadiness.blockers,
    ...missingScripts.map((scriptName) => `上线前核对所需 npm script 缺失：${scriptName}。`),
  ];
  const warnings = [
    ...privateReadiness.warnings,
    "本 runbook 只做本地只读核对和证据清单输出，不会连接线上 Supabase，不会执行迁移，不会写入业务数据。",
    "真实闭环 smoke 会写入验收库；只有在迁移、RLS 和备份核对完成后，才应由人工单独执行。",
  ];

  return {
    app: "lexos",
    ok: blockers.length === 0,
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    privateReadiness,
    migrationSummary: {
      required: requiredPrivateMigrationFiles.length,
      present: requiredPrivateMigrationFiles.length - missingMigrations.length,
      missing: missingMigrations,
    },
    blockers,
    warnings,
    stages: buildLaunchStages(),
  };
}

export function formatLaunchReadinessMarkdown(runbook: LaunchReadinessRunbook): string {
  const lines = [
    `# Lexos 上线前核对 Runbook`,
    "",
    `生成时间：${runbook.generatedAt}`,
    `总体状态：${runbook.ok ? "可进入人工上线核对" : "存在阻断项"}`,
    `运行模式：${runbook.privateReadiness.mode === "supabase" ? "真实 Supabase" : "内存 demo"}`,
    `关键迁移：${runbook.migrationSummary.present}/${runbook.migrationSummary.required}`,
    "",
    formatIssueList("阻断项", runbook.blockers),
    formatIssueList("提示", runbook.warnings),
    "",
  ].filter((line) => line !== undefined);

  for (const stage of runbook.stages) {
    lines.push(`## ${stage.title}`);
    lines.push("");

    for (const item of stage.items) {
      lines.push(`### ${item.title}`);
      lines.push(`- 性质：${item.required ? "必需" : "建议"} / ${item.readonly ? "只读或仅生成计划" : "需要人工确认后执行"}`);

      if (item.command) {
        lines.push(`- 命令：\`${item.command}\``);
      }

      lines.push(`- 留存证据：${item.expectedEvidence}`);
      item.notes.forEach((note) => lines.push(`- 说明：${note}`));
      lines.push("");
    }
  }

  return lines.join("\n").trimEnd();
}

function buildLaunchStages(): LaunchReadinessStage[] {
  return [
    {
      id: "local-preflight",
      title: "一、本地交付前置",
      items: [
        {
          id: "private-check",
          title: "私有化交付自检",
          required: true,
          readonly: true,
          command: "npm.cmd run private:check",
          expectedEvidence: "命令输出显示真实 Supabase 模式、环境变量、关键迁移、脚本和交付文档完整。",
          notes: ["该命令不会打印密钥值，也不会连接远端数据库。"],
        },
        {
          id: "verify",
          title: "基础质量门槛",
          required: true,
          readonly: true,
          command: "npm.cmd run verify",
          expectedEvidence: "lint、typecheck、单元测试和生产构建全部通过。",
          notes: ["Windows PowerShell 如拦截 npm，可使用 npm.cmd。"],
        },
      ],
    },
    {
      id: "migration-check",
      title: "二、数据库迁移核对",
      items: [
        {
          id: "migration-list",
          title: "迁移文件与远端应用状态核对",
          required: true,
          readonly: true,
          command: "supabase migration list",
          expectedEvidence: "远端项目已 link，迁移列表中所有 Lexos 必需迁移均显示已应用；若未 link，保留 SQL Editor 执行记录。",
          notes: [
            "本 runbook 不自动执行 supabase db push，正式应用迁移必须由负责人在维护窗口确认。",
            `必需迁移：${requiredPrivateMigrationFiles.join(", ")}。`,
          ],
        },
        {
          id: "schema-compatibility",
          title: "干净库或兼容库策略确认",
          required: true,
          readonly: true,
          expectedEvidence: "已确认目标库是干净 Supabase/Postgres 项目，或已记录兼容已有空表的处理策略。",
          notes: ["当前线上 LexOS 曾存在旧空表；正式生产建议优先使用干净项目或独立 schema 策略。"],
        },
      ],
    },
    {
      id: "storage-check",
      title: "三、Storage 与交付附件核对",
      items: [
        {
          id: "storage-bucket",
          title: "私有 bucket 核对",
          required: true,
          readonly: true,
          expectedEvidence: "Supabase Storage 中存在私有 bucket lexos-deliverables，上传、内部下载和客户验证码下载均走 Next.js API。",
          notes: ["不要把交付附件 bucket 设为公开；客户侧下载应继续使用短期 signed URL。"],
        },
        {
          id: "storage-backup-plan",
          title: "Storage 备份计划核对",
          required: true,
          readonly: true,
          command: "npm.cmd run backup:storage -- --dry-run",
          expectedEvidence: "输出 Storage 备份计划，确认 bucket、Supabase URL 和 service role 配置边界。",
          notes: ["dry-run 不下载对象，不写入远端。"],
        },
      ],
    },
    {
      id: "security-check",
      title: "四、安全边界核对",
      items: [
        {
          id: "rls",
          title: "RLS / Data API 直接访问验证",
          required: true,
          readonly: true,
          command: "npm.cmd run verify:rls",
          expectedEvidence: "service role 可读，anon 和 authenticated 不能直接读取内部 public 表。",
          notes: ["该验证需要测试用户密码，但不应在输出中记录密码。"],
        },
        {
          id: "env-secrets",
          title: "密钥暴露复核",
          required: true,
          readonly: true,
          expectedEvidence: "服务器 Secret Manager 或环境变量中没有 NEXT_PUBLIC_SERVICE_ROLE、DATABASE_URL 公开变量或截图泄露。",
          notes: ["service role key、数据库连接串和恢复确认口令只能在服务端运维环境保存。"],
        },
      ],
    },
    {
      id: "backup-rehearsal",
      title: "五、备份与恢复演练",
      items: [
        {
          id: "backup-schedule",
          title: "备份调度与系统任务安装核对",
          required: true,
          readonly: true,
          command: "npm.cmd run backup:schedule && npm.cmd run backup:task:check && npm.cmd run backup:run:check",
          expectedEvidence: "已归档 Windows Task Scheduler 或 Linux cron 建议、运行账号、日志目录、人工安装证据和最近成功运行证据。",
          notes: ["这些命令只输出计划和核对清单，不安装系统任务。"],
        },
        {
          id: "backup-rehearsal",
          title: "恢复演练报告",
          required: true,
          readonly: true,
          command: "npm.cmd run backup:rehearsal -- --latest",
          expectedEvidence: "生成数据库和 Storage 文件级恢复演练报告，并记录缺失文件为 0。",
          notes: ["演练报告只校验备份文件，不执行 psql 恢复，也不上传 Storage 对象。"],
        },
      ],
    },
    {
      id: "smoke-check",
      title: "六、真实闭环与部署后检查",
      items: [
        {
          id: "real-smoke",
          title: "真实闭环 smoke",
          required: true,
          readonly: false,
          command: "npm.cmd run smoke:real",
          expectedEvidence: "验收库中管理员、案源律师、办案律师、客户确认、财务结算闭环成功，最终结算状态 confirmed。",
          notes: ["该命令会写入客户、任务、反馈和结算记录，只能在允许写入的验收库执行。"],
        },
        {
          id: "post-launch-pages",
          title: "部署后核心页面复核",
          required: true,
          readonly: true,
          expectedEvidence: "管理员登录、用户、任务、客户大屏、结算、资金、审计、风控页面均可访问。",
          notes: ["复核时不要使用默认密码长期留存；管理员首次登录后必须改密。"],
        },
        {
          id: "preview-deployment-evidence",
          title: "Vercel Preview deployment evidence",
          required: true,
          readonly: true,
          command: "npm.cmd run deploy:preview:evidence",
          expectedEvidence: "Preview URL, deployment reference, build log reference, smoke result reference, owner, deployment timestamp, and upload approval reference are archived.",
          notes: ["Run this only after a real Vercel Preview upload and `npm.cmd run smoke:preview` have completed."],
        },
      ],
    },
    {
      id: "handover",
      title: "七、运维交接",
      items: [
        {
          id: "handover-record",
          title: "上线证据归档",
          required: true,
          readonly: true,
          expectedEvidence: "归档版本号、迁移状态、RLS 输出、smoke 结果、备份报告、管理员改密确认和运维联系人。",
          notes: ["客户数据、密钥和数据库连接串不得写入普通交付文档。"],
        },
      ],
    },
  ];
}

function formatIssueList(title: string, issues: string[]): string | undefined {
  if (!issues.length) {
    return undefined;
  }

  return [
    `${title}：`,
    ...issues.map((issue) => `- ${issue}`),
  ].join("\n");
}
