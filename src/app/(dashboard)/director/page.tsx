import { PlaceholderPanel } from "@/components/dashboard/PlaceholderPanel";
import { requireRole } from "@/lib/auth/guards";

export default async function DirectorPage() {
  await requireRole(["director"]);
  return (
    <PlaceholderPanel
      title="主任管理看板"
      description="律所运营与决策报表将在此呈现。"
    />
  );
}
