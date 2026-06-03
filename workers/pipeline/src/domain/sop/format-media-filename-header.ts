/**
 * 格式化卷宗文件名分隔标题（`prd.md` §3.8.4）。
 *
 * @param fileName - Storage 对象文件名（不含路径）
 * @returns 形如 `--- ${fileName} ---` 的标题行
 */
export function formatMediaFilenameHeader(fileName: string): string {
  return `--- ${fileName} ---`;
}
