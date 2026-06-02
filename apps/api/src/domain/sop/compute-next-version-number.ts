/**
 * 计算发布时的下一 `version_number`（`max(existingMax, 0) + 1`）。
 */
export function computeNextVersionNumber(existingMax: number): number {
  const safeMax = Number.isFinite(existingMax) ? Math.max(0, existingMax) : 0;
  return safeMax + 1;
}
