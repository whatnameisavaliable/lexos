/**
 * 启发式 Token 预估（chars/4）；首期不引入 tiktoken 依赖。
 */
export function estimateTokenCount(text: string): number {
  if (text.length === 0) {
    return 0;
  }
  return Math.ceil(text.length / 4);
}
