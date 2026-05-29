"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useActiveUpload } from "@/contexts/active-upload-context";
import { UploadLeaveAlertDialog } from "./upload-leave-alert-dialog";

/**
 * 上传中 `beforeunload` 与 SPA 路由拦截（`ui_design.md` §6.3.4.1–6.3.4.4）。
 */
export function UploadNavigationGuard() {
  const { hasActiveUpload, abortActiveUpload } = useActiveUpload();
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!hasActiveUpload) {
      return;
    }
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
    };
  }, [hasActiveUpload]);

  useEffect(() => {
    if (!hasActiveUpload) {
      return;
    }
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest("a[href]");
      if (!anchor) {
        return;
      }
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) {
        return;
      }
      const url = new URL(href, window.location.origin);
      if (url.pathname === pathname) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setPendingHref(href);
      setDialogOpen(true);
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
    };
  }, [hasActiveUpload, pathname]);

  function confirmLeave() {
    setDialogOpen(false);
    abortActiveUpload();
    const href = pendingHref;
    setPendingHref(null);
    if (href) {
      router.push(href);
    }
  }

  return (
    <UploadLeaveAlertDialog
      open={dialogOpen}
      onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setPendingHref(null);
        }
      }}
      onConfirmLeave={confirmLeave}
    />
  );
}
