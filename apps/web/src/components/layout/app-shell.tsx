"use client";

import Link from "next/link";
import { logout } from "@/lib/auth-api";
import { navItemsForRole } from "@/lib/menus";
import type { UserRole } from "@lexos/shared";
import { Button } from "@/components/ui/button";

export interface AppShellProps {
  readonly role: string;
  readonly username: string;
  readonly children: React.ReactNode;
}

/**
 * 业务壳布局（`ui_design.md` §3.1 CSS Grid）。
 */
export function AppShell({ role, username, children }: AppShellProps) {
  const nav = navItemsForRole(role as UserRole);

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar flex flex-col gap-2 p-4">
        <div className="text-lg font-semibold text-primary-foreground">LexOS</div>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm hover:bg-secondary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <header className="app-shell__header flex items-center justify-between px-6">
        <span className="text-sm text-muted-foreground">角色：{role}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm">{username}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void logout().then(() => window.location.assign("/login"))}
          >
            退出
          </Button>
        </div>
      </header>
      <main className="app-shell__main p-6">{children}</main>
    </div>
  );
}
