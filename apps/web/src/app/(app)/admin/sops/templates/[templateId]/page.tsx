import { AdminSopTemplateDetailPanel } from "@/components/admin/sops/AdminSopTemplateDetailPanel";

export interface AdminSopTemplatePageProps {
  readonly params: Promise<{ templateId: string }>;
}

/** 模板版本时间线页。 */
export default async function AdminSopTemplatePage({
  params,
}: AdminSopTemplatePageProps) {
  const { templateId } = await params;
  return <AdminSopTemplateDetailPanel templateId={templateId} />;
}
