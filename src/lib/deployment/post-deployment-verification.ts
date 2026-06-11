export const POST_DEPLOYMENT_VERIFICATION_KIND = "lexos-post-deployment-verification";

export type PostDeploymentCheckCategoryId =
  | "runtime-health"
  | "auth-navigation"
  | "business-readiness"
  | "security-boundary"
  | "storage-deliverables"
  | "exports-audit"
  | "backup-recovery"
  | "observability"
  | "rollback-signoff";

export type PostDeploymentCheckItem = {
  id: string;
  categoryId: PostDeploymentCheckCategoryId;
  title: string;
  required: boolean;
  ownerRole: string;
  command?: string;
  expectedEvidence: string[];
  manualOnly: boolean;
  writesData: boolean;
  notes: string[];
};

export type PostDeploymentVerification = {
  version: 1;
  app: "lexos";
  kind: typeof POST_DEPLOYMENT_VERIFICATION_KIND;
  generatedAt: string;
  owner: string;
  environment: string;
  releaseVersion: string;
  baseUrl: string;
  rollbackRef: string;
  observationOwner: string;
  ok: boolean;
  summary: {
    total: number;
    required: number;
    manualOnly: number;
    writesData: number;
    commandBacked: number;
  };
  blockers: string[];
  warnings: string[];
  items: PostDeploymentCheckItem[];
};

const defaultOwner = "未指定";
const defaultEnvironment = "未指定";
const defaultReleaseVersion = "未指定";
const defaultBaseUrl = "未指定";
const defaultRollbackRef = "未指定";
const defaultObservationOwner = "未指定";

const secretLikePattern = /(?:service_role|database_url|db_url|password|secret|token|private_key|access_key|credential|短信|sms)/i;

export function getPostDeploymentVerificationConfigFromEnv(env: NodeJS.ProcessEnv = process.env): {
  baseUrl: string;
  environment: string;
  observationOwner: string;
  owner: string;
  releaseVersion: string;
  rollbackRef: string;
} {
  return {
    baseUrl: env.LEXOS_POST_DEPLOYMENT_BASE_URL || defaultBaseUrl,
    environment:
      env.LEXOS_POST_DEPLOYMENT_ENVIRONMENT || env.LEXOS_FINAL_ACCEPTANCE_ENVIRONMENT || defaultEnvironment,
    observationOwner: env.LEXOS_POST_DEPLOYMENT_OBSERVATION_OWNER || defaultObservationOwner,
    owner: env.LEXOS_POST_DEPLOYMENT_OWNER || defaultOwner,
    releaseVersion:
      env.LEXOS_POST_DEPLOYMENT_RELEASE_VERSION || env.LEXOS_FINAL_ACCEPTANCE_RELEASE_VERSION || defaultReleaseVersion,
    rollbackRef: env.LEXOS_POST_DEPLOYMENT_ROLLBACK_REF || defaultRollbackRef,
  };
}

export function buildPostDeploymentVerification(options: {
  env?: NodeJS.ProcessEnv;
  generatedAt?: Date;
} = {}): PostDeploymentVerification {
  const config = getPostDeploymentVerificationConfigFromEnv(options.env ?? process.env);
  const items = buildPostDeploymentCheckItems();
  const blockers: string[] = [];
  const warnings: string[] = [
    "本清单只生成部署后回归核对项，不连接线上 Supabase、不执行真实 smoke、不写入业务数据。",
    "真实闭环 smoke、RLS 负向验证和客户附件下载复核必须由负责人在目标环境单独执行并归档证据。",
  ];

  if (config.owner === defaultOwner) {
    blockers.push("部署后回归核对必须指定负责人，请设置 LEXOS_POST_DEPLOYMENT_OWNER。");
  }

  if (config.environment === defaultEnvironment) {
    blockers.push("部署后回归核对必须指定目标环境，请设置 LEXOS_POST_DEPLOYMENT_ENVIRONMENT 或 LEXOS_FINAL_ACCEPTANCE_ENVIRONMENT。");
  }

  if (config.releaseVersion === defaultReleaseVersion) {
    blockers.push("部署后回归核对必须指定发布版本，请设置 LEXOS_POST_DEPLOYMENT_RELEASE_VERSION 或 LEXOS_FINAL_ACCEPTANCE_RELEASE_VERSION。");
  }

  if (config.baseUrl === defaultBaseUrl) {
    blockers.push("部署后回归核对必须指定应用访问地址，请设置 LEXOS_POST_DEPLOYMENT_BASE_URL。");
  } else {
    const urlValidation = validateBaseUrl(config.baseUrl);

    if (urlValidation.blocker) {
      blockers.push(urlValidation.blocker);
    }

    warnings.push(...urlValidation.warnings);
  }

  if (config.rollbackRef === defaultRollbackRef) {
    blockers.push("部署后回归核对必须指定回滚引用，请设置 LEXOS_POST_DEPLOYMENT_ROLLBACK_REF。");
  }

  if (secretLikePattern.test(config.releaseVersion) || secretLikePattern.test(config.rollbackRef)) {
    blockers.push("发布版本和回滚引用只能填写版本号、提交号、工单号或归档路径，不能包含 token、secret、连接串、访问密钥或短信服务信息。");
  }

  if (secretLikePattern.test(config.baseUrl)) {
    blockers.push("应用访问地址不能包含 token、secret、连接串、访问密钥或短信服务信息。");
  }

  if (config.observationOwner === defaultObservationOwner) {
    warnings.push("建议设置 LEXOS_POST_DEPLOYMENT_OBSERVATION_OWNER，明确上线后观察期联系人。");
  }

  const summary = {
    total: items.length,
    required: items.filter((item) => item.required).length,
    manualOnly: items.filter((item) => item.manualOnly).length,
    writesData: items.filter((item) => item.writesData).length,
    commandBacked: items.filter((item) => item.command).length,
  };

  return {
    version: 1,
    app: "lexos",
    kind: POST_DEPLOYMENT_VERIFICATION_KIND,
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    owner: config.owner,
    environment: config.environment,
    releaseVersion: config.releaseVersion,
    baseUrl: config.baseUrl,
    rollbackRef: config.rollbackRef,
    observationOwner: config.observationOwner,
    ok: blockers.length === 0,
    summary,
    blockers,
    warnings,
    items,
  };
}

export function formatPostDeploymentVerification(report: PostDeploymentVerification): string {
  const lines = [
    "# Lexos 部署后回归核对清单",
    "",
    `生成时间：${report.generatedAt}`,
    `总体状态：${report.ok ? "通过，可进入上线后观察期" : "存在阻断项"}`,
    `目标环境：${report.environment}`,
    `发布版本：${report.releaseVersion}`,
    `应用地址：${report.baseUrl}`,
    `回滚引用：${report.rollbackRef}`,
    `核对负责人：${report.owner}`,
    `观察期联系人：${report.observationOwner}`,
    `核对项：${report.summary.total} 项，其中必需 ${report.summary.required} 项、命令支持 ${report.summary.commandBacked} 项、人工项 ${report.summary.manualOnly} 项、会写数据 ${report.summary.writesData} 项`,
    "执行命令：`npm.cmd run postdeploy:check`",
    "",
  ];

  if (report.blockers.length) {
    lines.push("## 阻断项", "");
    report.blockers.forEach((blocker) => lines.push(`- ${blocker}`));
    lines.push("");
  }

  if (report.warnings.length) {
    lines.push("## 提示", "");
    report.warnings.forEach((warning) => lines.push(`- ${warning}`));
    lines.push("");
  }

  lines.push("## 核对清单", "");
  lines.push("| 分类 | 核对项 | 负责人角色 | 命令 |");
  lines.push("| --- | --- | --- | --- |");
  report.items.forEach((item) => {
    lines.push(
      `| ${categoryTitle(item.categoryId)} | ${item.title} | ${item.ownerRole} | ${item.command ? `\`${item.command}\`` : "人工确认"} |`,
    );
  });
  lines.push("");

  report.items.forEach((item) => {
    lines.push(`### ${item.title}`);
    lines.push(`- 性质：${item.required ? "必需" : "建议"}`);
    lines.push(`- 负责人角色：${item.ownerRole}`);
    lines.push(`- 执行方式：${item.command ? `\`${item.command}\`` : "人工确认"}`);
    lines.push(`- 人工项：${item.manualOnly ? "是" : "否"}`);
    lines.push(`- 写入数据：${item.writesData ? "是" : "否"}`);
    item.expectedEvidence.forEach((evidence) => lines.push(`- 留存证据：${evidence}`));
    item.notes.forEach((note) => lines.push(`- 说明：${note}`));
    lines.push("");
  });

  lines.push("## 执行边界", "");
  lines.push("- 本清单是上线完成后的只读核对索引，不自动访问线上接口、不读取密钥、不连接线上 Supabase。");
  lines.push("- `smoke:real` 会写入验收环境数据，只能在允许写入的目标环境由负责人单独执行并归档。");
  lines.push("- 客户附件下载仍使用验证码演示链路，不接入真实短信。");
  lines.push("- 真实短信、新手保护期、新兵引流池、证据矩阵和 AI 辅助功能仍不在本期交付范围。");

  return lines.join("\n").trimEnd();
}

function buildPostDeploymentCheckItems(): PostDeploymentCheckItem[] {
  return [
    item("runtime-health", "health-endpoint", "应用健康检查", true, "运维负责人", "curl -fsS <base-url>/api/health", [
      "`/api/health` 返回成功状态，响应中不包含密钥、连接串或内部错误堆栈。",
    ], false, false, ["该命令需要将 `<base-url>` 替换为目标环境访问地址。"]),
    item("runtime-health", "static-assets", "静态资源与首屏可访问性", true, "交付负责人", undefined, [
      "目标地址首屏可打开，核心样式、图标和字体加载正常，无空白页。",
    ], true, false, ["如部署在 Vercel，应同时归档生产部署 URL 和部署详情页截图或工单引用。"]),
    item("auth-navigation", "admin-login", "管理员登录与核心导航", true, "交付负责人", undefined, [
      "管理员可登录，用户、客户、任务、结算、资金、审计、风控、权限和系统参数页面可访问。",
    ], true, false, ["不得在证据中记录管理员密码或一次性验证码。"]),
    item("auth-navigation", "lawyer-workbench", "律师个人工作台入口", true, "交付负责人", undefined, [
      "律师账号可进入个人工作台，发起/承办任务、交付记录和绩效信息显示正常。",
    ], true, false, ["仅保留脱敏截图或文字结论。"]),
    item("business-readiness", "private-readiness", "私有化交付自检复跑", true, "交付负责人", "npm.cmd run private:check", [
      "真实 Supabase 模式、必要变量、关键迁移、脚本和文档完整性检查通过。",
    ], false, false, ["该命令不确认远端迁移状态，只核对本地交付前置条件。"]),
    item("business-readiness", "real-smoke", "真实闭环 smoke 复核", true, "交付负责人", "npm.cmd run smoke:real", [
      "配置管理员、主任、律师、客户确认和财务结算闭环成功，最终状态已归档。",
    ], true, true, ["该命令会写入验收数据，只能在允许写入的目标环境执行。"]),
    item("security-boundary", "rls-verification", "RLS / Data API 负向验证", true, "安全复核人", "npm.cmd run verify:rls", [
      "service role 可读，anon/authenticated 不能直接读取内部 public 表。",
    ], true, false, ["需在目标环境单独执行并归档输出。"]),
    item("security-boundary", "tenant-boundary", "多律所租户隔离复核", true, "安全复核人", "npm.cmd run tenant:check", [
      "组织过滤、客户 token 组织来源和 Storage 路径隔离规则已复核。",
    ], false, false, ["跨组织负向测试仍需人工在验收库执行。"]),
    item("storage-deliverables", "customer-download", "客户交付附件下载复核", true, "交付负责人", undefined, [
      "客户侧可通过授权链路下载交付附件，未授权或验证码错误时拒绝访问。",
    ], true, false, ["当前只使用演示验证码链路，不接入真实短信。"]),
    item("exports-audit", "audit-settlement-export", "审计与结算导出复核", true, "财务/审计负责人", undefined, [
      "审计报表、结算导出和批量确认留痕可用，导出文件不包含不应交付的密钥或连接串。",
    ], true, false, ["导出样本应存放在受控证据目录，不进入源码交付包。"]),
    item("backup-recovery", "backup-schedule-rehearsal", "备份任务安装、运行与恢复演练证据复核", true, "运维负责人", "npm.cmd run backup:task:check && npm.cmd run backup:run:check && npm.cmd run backup:rehearsal", [
      "运行账号、日志目录、最近成功备份、数据库备份、Storage 对象备份、恢复演练报告、保留期和文件缺失阻断规则均已归档。",
    ], true, false, ["默认只生成核对清单或校验文件，不安装系统任务、不执行真实恢复。"]),
    item("observability", "logs-performance", "错误、性能与运维日志复核", true, "运维负责人", "npm.cmd run ops:log:check && npm.cmd run error:log:check && npm.cmd run perf:check", [
      "发布、迁移、备份、恢复、安全核对、错误脱敏和性能阈值留痕路径已确认。",
    ], false, false, ["当前不接入外部 APM，不采集真实用户敏感数据。"]),
    item("rollback-signoff", "final-gate", "最终门禁与证据索引复跑", true, "交付负责人", "npm.cmd run final:gate:check && npm.cmd run handover:evidence:check", [
      "最终门禁通过，交付证据索引、签收引用、回滚窗口和观察期联系人已归档。",
    ], false, false, ["若最终门禁阻断，必须先补齐阻断项再进入签收后观察期。"]),
    item("rollback-signoff", "rollback-window", "回滚窗口与观察期确认", true, "运维负责人", undefined, [
      "回滚引用、回滚负责人、观察期时长、升级联系人和客户确认口径已留存。",
    ], true, false, ["回滚引用不能包含密钥、连接串、访问 token 或短信服务信息。"]),
  ];
}

function item(
  categoryId: PostDeploymentCheckCategoryId,
  id: string,
  title: string,
  required: boolean,
  ownerRole: string,
  command: string | undefined,
  expectedEvidence: string[],
  manualOnly: boolean,
  writesData: boolean,
  notes: string[],
): PostDeploymentCheckItem {
  return {
    id,
    categoryId,
    title,
    required,
    ownerRole,
    command,
    expectedEvidence,
    manualOnly,
    writesData,
    notes,
  };
}

function validateBaseUrl(baseUrl: string): {
  blocker?: string;
  warnings: string[];
} {
  try {
    const parsed = new URL(baseUrl);
    const warnings: string[] = [];

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        blocker: "应用访问地址必须使用 http 或 https 协议。",
        warnings,
      };
    }

    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "::1") {
      warnings.push("当前应用访问地址指向本机地址，只适合本地演练；生产验收应改为目标环境正式地址。");
    }

    return { warnings };
  } catch {
    return {
      blocker: "应用访问地址格式无效，请设置为完整的 http/https URL。",
      warnings: [],
    };
  }
}

function categoryTitle(categoryId: PostDeploymentCheckCategoryId): string {
  const titles: Record<PostDeploymentCheckCategoryId, string> = {
    "auth-navigation": "登录导航",
    "backup-recovery": "备份恢复",
    "business-readiness": "业务闭环",
    "exports-audit": "导出审计",
    observability: "运维观测",
    "rollback-signoff": "回滚签收",
    "runtime-health": "运行健康",
    "security-boundary": "安全边界",
    "storage-deliverables": "交付附件",
  };

  return titles[categoryId];
}
