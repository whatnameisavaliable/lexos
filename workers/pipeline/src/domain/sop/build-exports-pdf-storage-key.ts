/**
 * 构建 SOP PDF 在 `exports` 桶的 Storage 对象键（`database.md` §3.16.8 · `CONTEXT_SUMMARY.md` §6.4）。
 *
 * @param ownerId - 律师用户 ID（路径首段必须为 owner_id）
 * @param pipelineId - 案件流水线 ID
 * @param artifactId - 产出物 ID
 */
export function buildExportsPdfStorageKey(
  ownerId: string,
  pipelineId: string,
  artifactId: string,
): string {
  return `${ownerId}/sops/${pipelineId}/${artifactId}.pdf`;
}
