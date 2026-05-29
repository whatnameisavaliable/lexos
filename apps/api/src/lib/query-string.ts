/**
 * 解析 URL 查询字符串为普通对象（单值；重复键取首个）。
 */
export function parseQueryString(
  url: string | undefined,
): Record<string, string | undefined> {
  if (!url?.includes("?")) {
    return {};
  }
  const query = url.slice(url.indexOf("?") + 1);
  const params = new URLSearchParams(query);
  const result: Record<string, string | undefined> = {};
  for (const [key, value] of params.entries()) {
    if (!(key in result)) {
      result[key] = value;
    }
  }
  return result;
}
