import { AuditLogsPanel } from "@/components/admin/AuditLogsPanel";
import { requireRole } from "@/lib/auth/guards";

export default async function AdminAuditPage() {
  await requireRole(["admin"]);
  return <AuditLogsPanel />;
}
