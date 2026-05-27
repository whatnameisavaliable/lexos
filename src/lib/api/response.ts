import { NextResponse } from "next/server";

import type { ApiErrorBody, ApiResponse } from "@/types/api";

export function jsonSuccess<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ ok: true, data }, { status });
}

export function jsonError(
  code: string,
  message: string,
  status = 400,
): NextResponse<ApiResponse<never>> {
  const body: ApiErrorBody = { code, message };
  return NextResponse.json({ ok: false, error: body }, { status });
}
