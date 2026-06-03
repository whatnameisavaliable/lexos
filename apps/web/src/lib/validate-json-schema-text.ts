export interface JsonSchemaValidationResult {
  readonly ok: boolean;
  readonly error?: string;
  readonly value?: Record<string, unknown>;
}

/**
 * 校验 JSON Schema 文本：须为合法 JSON 且根节点为对象。
 */
export function validateJsonSchemaText(text: string): JsonSchemaValidationResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: true, value: {} };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: "JSON 格式无效" };
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "JSON Schema 根节点须为对象" };
  }

  return { ok: true, value: parsed as Record<string, unknown> };
}
