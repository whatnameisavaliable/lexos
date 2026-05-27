import { getAppUrl } from "@/lib/env";

export function buildResetPasswordUrl(token: string): string {
  const base = getAppUrl().replace(/\/$/, "");
  return `${base}/reset-password?token=${encodeURIComponent(token)}`;
}
