import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ACCESS_TOKEN_COOKIE = "lexos_access_token";

const PUBLIC_PATHS = new Set(["/login", "/unauthorized"]);

/**
 * Edge 粗筛：无 token Cookie 时拦截业务区（细粒度守卫见 `SessionGuard`）。
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    PUBLIC_PATHS.has(pathname)
  ) {
    return NextResponse.next();
  }

  const isAuthFlow = pathname === "/change-password" || pathname === "/mfa/setup";

  if (!token && !isAuthFlow) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/lawyer", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
