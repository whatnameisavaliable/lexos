type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  code?: string;
  userId?: string;
  requestId?: string;
  meta?: Record<string, unknown>;
}

export function logStructured(payload: LogPayload): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    ...payload,
  });

  if (payload.level === "error") {
    console.error(line);
    return;
  }

  if (payload.level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
}
