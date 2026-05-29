import { execFileSync, execSync } from "node:child_process";

/** Supabase CLI 可执行文件解析结果。 */
export interface SupabaseCliResolution {
  /** 实际调用的命令（如 `supabase` 或 `npx`） */
  readonly command: string;
  /** 传给 exec 的参数（`npx` 时为 `['supabase', ...]`） */
  readonly args: readonly string[];
}

/**
 * 在 Windows 上 `npx supabase` 可能因缺少预编译二进制失败；优先使用 PATH 中的全局 `supabase`。
 */
export function resolveSupabaseCli(): SupabaseCliResolution {
  if (process.platform === "win32") {
    return { command: "supabase", args: [] };
  }
  return { command: "npx", args: ["supabase"] };
}

/**
 * 执行 `supabase --version` 并返回版本字符串（去除空白）。
 */
export function getSupabaseCliVersion(
  resolution: SupabaseCliResolution = resolveSupabaseCli(),
  execRunner: Pick<typeof import("node:child_process"), "execFileSync" | "execSync"> = {
    execFileSync,
    execSync,
  },
): string {
  const args = [...resolution.args, "--version"];
  if (resolution.command === "npx") {
    const output = execRunner.execSync(`npx ${args.join(" ")}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    return output.trim();
  }

  const output = execRunner.execFileSync(resolution.command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return output.trim();
}

/**
 * 断言 Supabase CLI 已安装且可执行（版本号非空）。
 */
export function assertSupabaseCliInstalled(): string {
  const version = getSupabaseCliVersion();
  if (!version) {
    throw new Error("Supabase CLI returned empty version string");
  }
  return version;
}
