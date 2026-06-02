/**
 * `GET /api/sops/templates` 列表行（律师端，仅已发布版本 · `prd.md` §3.9.2）。
 */
export interface SopPublishedTemplateItem {
  readonly templateVersionId: string;
  readonly templateName: string;
  readonly caseType: string;
  readonly versionNumber: number;
}
