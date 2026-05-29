import { SessionGuard } from "@/components/auth/session-guard";
import { AppShellLoader } from "@/components/layout/app-shell-loader";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionGuard>
      <AppShellLoader>{children}</AppShellLoader>
    </SessionGuard>
  );
}
