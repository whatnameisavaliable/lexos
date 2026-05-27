import { PlaceholderPanel } from "@/components/dashboard/PlaceholderPanel";
import { requireRole } from "@/lib/auth/guards";

export default async function LawyerPage() {
  await requireRole(["lawyer"]);
  return (
    <PlaceholderPanel
      title="律师工作台"
      description="案件办理、文书与协作功能将在此呈现。"
    />
  );
}
