import { PlaceholderPanel } from "@/components/dashboard/PlaceholderPanel";
import { requireRole } from "@/lib/auth/guards";

export default async function ChannelPage() {
  await requireRole(["channel_partner"]);
  return (
    <PlaceholderPanel
      title="渠道看板"
      description="渠道引荐与协作数据将在此呈现。"
    />
  );
}
