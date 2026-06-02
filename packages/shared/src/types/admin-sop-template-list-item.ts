/**
 * 模板版本列表摘要（嵌套于 {@link AdminSopTemplateListItem}）。
 */
export interface AdminSopTemplateVersionSummary {
  readonly versionId: string;
  readonly versionNumber: number;
  readonly isPublished: boolean;
  readonly publishedAt: string | null;
  readonly createdAt: string;
}

/**
 * `GET /api/admin/sops` 列表行（`prd.md` §3.9.1）。
 */
export interface AdminSopTemplateListItem {
  readonly templateId: string;
  readonly name: string;
  readonly caseType: string;
  readonly createdAt: string;
  readonly versions: readonly AdminSopTemplateVersionSummary[];
}
