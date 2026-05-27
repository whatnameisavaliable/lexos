import type { NextRequest } from "next/server";

export function getRequestMeta(request: NextRequest): {
  ip: string | null;
  userAgent: string | null;
} {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent");
  return { ip: ip ?? null, userAgent };
}
