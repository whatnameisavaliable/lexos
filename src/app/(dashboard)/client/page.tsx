import { PlaceholderPanel } from "@/components/dashboard/PlaceholderPanel";
import { requireRole } from "@/lib/auth/guards";

export default async function ClientPage() {
  await requireRole(["client"]);
  return (
    <PlaceholderPanel
      title="客户门户"
      description="案件进度与文件查阅将在此呈现。"
    />
  );
}
