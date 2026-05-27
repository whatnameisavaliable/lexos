import { Scale } from "lucide-react";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { UserAccountMenu } from "@/components/auth/UserAccountMenu";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Separator } from "@/components/ui/separator";
import { roleMenuTemplates } from "@/lib/menus";
import type { Profile } from "@/types/user";

interface AppShellProps {
  profile: Profile;
  children: React.ReactNode;
}

const roleLabels: Record<Profile["role"], string> = {
  admin: "系统管理员",
  lawyer: "律师",
  client: "客户",
  channel_partner: "外部渠道商",
  director: "主任",
};

export function AppShell({ profile, children }: AppShellProps) {
  const menu = roleMenuTemplates[profile.role];

  return (
    <div className="flex min-h-svh w-full">
      <aside className="sticky top-0 flex h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Scale className="size-5" aria-hidden />
          </div>
          <div>
            <p className="font-heading text-sm font-semibold tracking-wide">
              LexOS
            </p>
            <p className="text-xs text-sidebar-foreground/70">律所协作平台</p>
          </div>
        </div>
        <Separator className="bg-sidebar-border" />
        <div className="flex-1 px-3 py-4">
          <SidebarNav items={menu} />
        </div>
        <div className="space-y-3 border-t border-sidebar-border px-3 py-4">
          <SignOutButton />
          <p className="px-3 text-xs text-sidebar-foreground/60">
            单租户 · 企业级权限
          </p>
        </div>
      </aside>

      <div className="flex h-svh min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-6">
          <div>
            <p className="text-sm font-medium text-foreground">
              {roleLabels[profile.role]}
            </p>
            <p className="text-xs text-muted-foreground">
              当前用户：{profile.username}
            </p>
          </div>
          <UserAccountMenu username={profile.username} />
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
