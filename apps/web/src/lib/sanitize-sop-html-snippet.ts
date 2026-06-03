import DOMPurify from "isomorphic-dompurify";

/**
 * 净化 SOP HTML 片段（非 iframe 场景；禁止 script 与 on* 事件）。
 */
export function sanitizeSopHtmlSnippet(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
  });
}
