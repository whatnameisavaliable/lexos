/** OpenAI Chat Completions 消息体。 */
export interface OpenAiChatMessage {
  readonly role: "system" | "user" | "assistant";
  readonly content: string;
}

/** `buildOpenAiChatCompletionBody` 可选参数。 */
export interface BuildOpenAiChatCompletionOptions {
  readonly model: string;
  readonly temperature?: number;
}

/**
 * 构建 OpenAI 兼容 `/chat/completions` 请求体（纯对象，不含未定义字段）。
 */
export function buildOpenAiChatCompletionBody(
  messages: readonly OpenAiChatMessage[],
  options: BuildOpenAiChatCompletionOptions,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: options.model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  };
  if (options.temperature !== undefined) {
    body.temperature = options.temperature;
  }
  return body;
}
