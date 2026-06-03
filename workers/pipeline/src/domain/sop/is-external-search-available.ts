/** 外网 Search/Tool 探测选项（测试可注入 Mock fetch）。 */
export interface ExternalSearchProbeOptions {
  /** 探测 URL；默认读取 `SOP_EXTERNAL_SEARCH_PROBE_URL`。 */
  readonly probeUrl?: string;
  /** HTTP 客户端；默认 `globalThis.fetch`。 */
  readonly fetchFn?: typeof fetch;
  /** 探测超时（毫秒）；默认 5_000。 */
  readonly timeoutMs?: number;
}

const DEFAULT_PROBE_TIMEOUT_MS = 5_000;

/**
 * 探测外网 Search/Tool API 是否可达（`architecture.md` §3.2.6.7）。
 *
 * 未配置 `SOP_EXTERNAL_SEARCH_PROBE_URL` 或探测失败/超时 → `false`（静默降级 LLM-only）。
 */
export async function isExternalSearchAvailable(
  options: ExternalSearchProbeOptions = {},
): Promise<boolean> {
  const probeUrl =
    options.probeUrl ?? process.env.SOP_EXTERNAL_SEARCH_PROBE_URL?.trim();
  if (!probeUrl) {
    return false;
  }

  const fetchFn = options.fetchFn ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS;
  const controller = new AbortController();

  try {
    const response = await Promise.race([
      fetchFn(probeUrl, {
        method: "GET",
        signal: controller.signal,
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          controller.abort();
          reject(new Error("SOP external search probe timed out"));
        }, timeoutMs);
      }),
    ]);
    return response.ok;
  } catch {
    return false;
  }
}
