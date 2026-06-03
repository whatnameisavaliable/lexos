import { AdminSopVersionEditorShell } from "@/components/admin/sops/AdminSopVersionEditorShell";

export interface AdminSopVersionEditorPageProps {
  readonly params: Promise<{ versionId: string }>;
}

/** 模板版本编辑页。 */
export default async function AdminSopVersionEditorPage({
  params,
}: AdminSopVersionEditorPageProps) {
  const { versionId } = await params;
  return <AdminSopVersionEditorShell versionId={versionId} />;
}
