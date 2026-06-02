"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSession } from "@/lib/auth-api";
import { refreshSession } from "@/lib/refresh-session";
import { resolveGuardRedirect } from "@/lib/router-guard";
import { clearAccessToken, getRefreshToken } from "@/lib/session";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 客户端路由守卫（配合 `middleware.ts` Cookie 粗筛；`ui_design.md` §5.2）。
 */
export function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      let session = null;
      try {
        session = await getSession();
      } catch {
        if (getRefreshToken()) {
          try {
            await refreshSession();
            session = await getSession();
          } catch {
            clearAccessToken();
          }
        } else {
          clearAccessToken();
        }
      }

      const redirect = resolveGuardRedirect(pathname, session);
      if (!cancelled && redirect && redirect !== pathname) {
        router.replace(redirect);
        return;
      }
      if (!cancelled) {
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] flex-col gap-3 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return <>{children}</>;
}
