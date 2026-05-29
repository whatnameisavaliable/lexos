"use client";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

/** 全局客户端 Provider（Sonner Toast、Tooltip）。 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      {children}
      <Toaster richColors closeButton position="top-center" />
    </TooltipProvider>
  );
}
