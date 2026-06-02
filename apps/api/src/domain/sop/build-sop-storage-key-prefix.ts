/**
 * 构建 SOP 卷宗 Storage 对象键前缀（`prd.md` §3.8.4 · `CONTEXT_SUMMARY.md` §6.4）。
 * TUS 上传 **必须** 仅在此前缀下创建对象；首段为 `owner_id`（律师 `auth.uid()`）。
 */
export function buildSopMediaStorageKeyPrefix(
  ownerId: string,
  pipelineId: string,
): string {
  const trimmedOwner = ownerId.trim();
  const trimmedPipeline = pipelineId.trim();
  if (!trimmedOwner || !trimmedPipeline) {
    throw new Error("ownerId and pipelineId are required for SOP storage prefix");
  }
  return `${trimmedOwner}/sops/${trimmedPipeline}/`;
}
