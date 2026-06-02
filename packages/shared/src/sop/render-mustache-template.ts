const SLOT_RE = /\{\{([^{}#/][^{}]*)\}\}/g;

/**
 * 渲染 Mustache 风格模板：已知键替换为值，未知键**保留原占位**（不截断正文）。
 */
export function renderMustacheTemplate(
  template: string,
  context: Readonly<Record<string, string>>,
): string {
  return template.replace(SLOT_RE, (full, rawName: string) => {
    const name = rawName.trim();
    if (Object.prototype.hasOwnProperty.call(context, name)) {
      return context[name] ?? "";
    }
    return full;
  });
}
