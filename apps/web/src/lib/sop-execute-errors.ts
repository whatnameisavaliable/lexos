/** `executeSopStep` 业务错误 Toast 文案。 */
export function sopExecuteErrorToastMessage(code: string): string | null {
  if (code === "OPERATION_NOT_ALLOWED") {
    return "当前操作不允许，请检查流水线状态或步骤顺序";
  }
  if (code === "CONTEXT_LIMIT_EXCEEDED") {
    return "上下文超出限制，请精简卷宗或表单内容后重试";
  }
  return null;
}
