/**
 * 将 RJSF `formData` 规范为 execute 请求体 `formValues`。
 */
export function coerceSopFormValues(
  formData: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!formData || typeof formData !== "object" || Array.isArray(formData)) {
    return {};
  }
  return { ...formData };
}
