import { SessionGuard } from "@/components/auth/session-guard";
import { AppProviders } from "@/components/layout/app-providers";
import { AppShellLoader } from "@/components/layout/app-shell-loader";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionGuard>
      <AppProviders>
        <AppShellLoader>{children}</AppShellLoader>
      </AppProviders>
    </SessionGuard>
  );
}
