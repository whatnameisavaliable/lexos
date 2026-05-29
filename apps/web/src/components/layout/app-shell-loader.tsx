"use client";

import { useEffect, useState } from "react";
import { getSession, type SessionResponseData } from "@/lib/auth-api";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

export function AppShellLoader({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionResponseData | null>(null);

  useEffect(() => {
    void getSession().then(setSession);
  }, []);

  if (!session) {
    return (
      <div className="p-6">
        <Skeleton className="mb-4 h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (session.requiresPasswordChange) {
    return <>{children}</>;
  }

  return (
    <AppShell role={session.role} username={session.username}>
      {children}
    </AppShell>
  );
}
