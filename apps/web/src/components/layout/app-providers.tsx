"use client";

import { ActiveUploadProvider } from "@/contexts/active-upload-context";
import { UploadNavigationGuard } from "@/components/transcription/upload-navigation-guard";

/** `(app)` 布局层客户端 Provider（上传状态 + 路由拦截）。 */
export function AppProviders({ children }: { readonly children: React.ReactNode }) {
  return (
    <ActiveUploadProvider>
      <UploadNavigationGuard />
      {children}
    </ActiveUploadProvider>
  );
}
