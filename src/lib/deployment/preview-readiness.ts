export type PreviewRuntimeMode = "demo" | "supabase";

export type PreviewReadiness = {
  app: "lexos";
  mode: PreviewRuntimeMode;
  ok: boolean;
  supabaseConfigured: boolean;
  missingSupabaseEnvKeys: string[];
  warnings: string[];
};

const supabaseEnvKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export function getPreviewRuntimeMode(env: NodeJS.ProcessEnv = process.env): PreviewRuntimeMode {
  return env.NEXT_PUBLIC_DEMO_MODE === "false" ? "supabase" : "demo";
}

export function buildPreviewReadiness(env: NodeJS.ProcessEnv = process.env): PreviewReadiness {
  const mode = getPreviewRuntimeMode(env);
  const missingSupabaseEnvKeys = supabaseEnvKeys.filter((key) => !env[key]);
  const supabaseConfigured = missingSupabaseEnvKeys.length === 0;
  const warnings: string[] = [];
  const rawDemoMode = env.NEXT_PUBLIC_DEMO_MODE;

  if (!rawDemoMode) {
    warnings.push("NEXT_PUBLIC_DEMO_MODE 未显式配置，系统会按内存 demo 模式运行。Vercel Preview 建议显式设置为 true。");
  }

  if (rawDemoMode && !["true", "false"].includes(rawDemoMode)) {
    warnings.push("NEXT_PUBLIC_DEMO_MODE 不是 true/false，系统会按内存 demo 模式运行。");
  }

  if (mode === "demo" && supabaseConfigured) {
    warnings.push("当前为内存 demo 模式，但 Supabase 变量已配置；确认没有把 service role key 暴露到不必要的 Preview 环境。");
  }

  return {
    app: "lexos",
    mode,
    ok: mode === "demo" || supabaseConfigured,
    supabaseConfigured,
    missingSupabaseEnvKeys: mode === "supabase" ? missingSupabaseEnvKeys : [],
    warnings,
  };
}

export function formatPreviewReadiness(readiness: PreviewReadiness): string {
  const lines = [
    `Lexos Preview 自检：${readiness.ok ? "通过" : "未通过"}`,
    `运行模式：${readiness.mode === "demo" ? "内存 demo" : "真实 Supabase"}`,
    `Supabase 变量：${readiness.supabaseConfigured ? "已配置完整" : "未配置完整"}`,
  ];

  if (readiness.missingSupabaseEnvKeys.length) {
    lines.push(`缺失变量：${readiness.missingSupabaseEnvKeys.join(", ")}`);
  }

  if (readiness.warnings.length) {
    lines.push("提示：");
    readiness.warnings.forEach((warning) => {
      lines.push(`- ${warning}`);
    });
  }

  return lines.join("\n");
}
