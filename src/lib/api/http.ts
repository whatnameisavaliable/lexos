import { NextResponse } from "next/server";

import { ApiError, type ApiErrorCode } from "./errors.ts";

export { ApiError };
export type { ApiErrorCode };

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, message: "ok" }, { status });
}

export function fail(status: number, code: ApiErrorCode, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return fail(error.status, error.code, error.message);
  }

  const message = error instanceof Error ? error.message : "系统错误";
  return fail(500, "INTERNAL_ERROR", message);
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = (await request.json()) as unknown;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new ApiError(400, "BAD_REQUEST", "请求体必须是 JSON 对象");
    }

    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(400, "BAD_REQUEST", "请求体不是有效 JSON");
  }
}

export function stringField(body: Record<string, unknown>, key: string, label: string): string {
  const value = body[key];

  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, "BAD_REQUEST", `${label}不能为空`);
  }

  return value.trim();
}

export function optionalStringField(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key];

  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ApiError(400, "BAD_REQUEST", `${key}必须是字符串`);
  }

  return value.trim();
}

export function optionalNumberField(body: Record<string, unknown>, key: string): number | undefined {
  const value = body[key];

  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new ApiError(400, "BAD_REQUEST", `${key}必须是数字`);
  }

  return parsed;
}

export async function routeParam(
  context: { params: Promise<Record<string, string>> | Record<string, string> },
  key: string,
): Promise<string> {
  const params = await context.params;
  const value = params[key];

  if (!value) {
    throw new ApiError(400, "BAD_REQUEST", `缺少路径参数 ${key}`);
  }

  return value;
}
