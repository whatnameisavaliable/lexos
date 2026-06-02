import { ErrorCode } from "@lexos/shared/api";
import { LexosError } from "@lexos/shared";

/**
 * 断言模板版本为可编辑草稿（`is_published=false`）。
 * 已发布版本禁止 `PUT .../prompts`（`prd.md` §3.4.1）。
 *
 * @throws {LexosError} `OPERATION_NOT_ALLOWED` 当 `isPublished` 为 true
 */
export function assertTemplateVersionEditable(isPublished: boolean): void {
  if (isPublished) {
    throw new LexosError(
      ErrorCode.OPERATION_NOT_ALLOWED,
      "Published template versions are read-only; create a new draft version",
    );
  }
}
