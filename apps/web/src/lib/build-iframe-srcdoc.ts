/**
 * 将 HTML 片段包裹为 iframe `srcDoc` 用最小文档（不注入 script）。
 */
export function buildIframeSrcdoc(html: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
}
