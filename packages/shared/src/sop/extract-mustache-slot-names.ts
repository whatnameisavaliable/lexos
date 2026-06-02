const MUSTACHE_SLOT_RE = /\{\{([^{}#/][^{}]*)\}\}/g;

/**
 * 从模板正文提取 Mustache 插槽名（不含花括号）。
 */
export function extractMustacheSlotNames(template: string): readonly string[] {
  const names = new Set<string>();
  for (const match of template.matchAll(MUSTACHE_SLOT_RE)) {
    const raw = match[1]?.trim();
    if (raw) {
      names.add(raw);
    }
  }
  return [...names];
}
