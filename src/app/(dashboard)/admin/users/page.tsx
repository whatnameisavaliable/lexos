import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { requireRole } from "@/lib/auth/guards";

export default async function AdminUsersPage() {
  await requireRole(["admin"]);
  return <AdminUsersPanel />;
}
