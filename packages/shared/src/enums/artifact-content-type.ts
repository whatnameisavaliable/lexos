/**
 * `artifact_content_type` 枚举（`database.md` §3.16.5）。
 */
export const ArtifactContentType = {
  MARKDOWN: "markdown",
  HTML: "html",
  JSON: "json",
} as const;

/** 产出物内容类型。 */
export type ArtifactContentType =
  (typeof ArtifactContentType)[keyof typeof ArtifactContentType];

/** 全部合法 `artifact_content_type` 字面量。 */
export const ARTIFACT_CONTENT_TYPE_VALUES: readonly ArtifactContentType[] =
  Object.values(ArtifactContentType);

/**
 * 判断字符串是否为合法 {@link ArtifactContentType}。
 */
export function isArtifactContentType(
  value: string,
): value is ArtifactContentType {
  return ARTIFACT_CONTENT_TYPE_VALUES.includes(value as ArtifactContentType);
}
