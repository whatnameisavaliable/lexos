/**
 * 转写文稿导出格式（`tasks.md` M6-A · `prd.md` §2.2）。
 */
export const EXPORT_FORMAT_VALUES = ["docx", "pdf", "txt"] as const;

/** 支持的导出 MIME 类别。 */
export type ExportFormat = (typeof EXPORT_FORMAT_VALUES)[number];

/**
 * 类型守卫：判断字符串是否为合法导出格式。
 */
export function isExportFormat(value: string): value is ExportFormat {
  return (EXPORT_FORMAT_VALUES as readonly string[]).includes(value);
}
