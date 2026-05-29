import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ZodError } from "zod";

/**
 * 将 Zod 校验错误映射到 react-hook-form 字段（避免 monorepo 内双份 zod + zodResolver 兼容问题）。
 */
export function applyZodErrors<T extends FieldValues>(
  error: ZodError,
  setError: UseFormSetError<T>,
): void {
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string") {
      setError(field as Path<T>, { type: "manual", message: issue.message });
    }
  }
}
