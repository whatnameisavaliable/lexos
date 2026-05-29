/**
 * 简单路径模板匹配（`:param` 段）。
 *
 * @param pattern - 如 `/api/admin/users/:id`
 * @param path - 实际请求路径（不含 query）
 * @returns 路径参数；不匹配返回 `null`
 */
export function matchRoutePattern(
  pattern: string,
  path: string,
): Record<string, string> | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const segment = patternParts[i]!;
    const value = pathParts[i]!;
    if (segment.startsWith(":")) {
      params[segment.slice(1)] = decodeURIComponent(value);
    } else if (segment !== value) {
      return null;
    }
  }

  return params;
}
