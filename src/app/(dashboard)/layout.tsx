import { AppShell } from "@/components/layout/AppShell";
import { requireAuthProfile } from "@/lib/auth/guards";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAuthProfile();
  return <AppShell profile={profile}>{children}</AppShell>;
}
