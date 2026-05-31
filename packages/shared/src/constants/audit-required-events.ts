/**
 * `public.audit_action` 枚举全集（`database.md` §1.2）。
 * 供覆盖率静态测试与 BFF/Worker 写入校验引用。
 */
export const AUDIT_ACTION_VALUES = [
  "auth.login_success",
  "auth.login_failure",
  "auth.logout",
  "auth.password_change",
  "auth.password_reset",
  "user.create",
  "user.update",
  "user.disable",
  "user.enable",
  "ai.model.upsert",
  "ai.mapping.upsert",
  "ai.prompt.publish",
  "task.create",
  "task.complete",
  "task.fail",
  "file.download",
  "file.delete",
  "file.export",
] as const;

/** 单条审计动作类型。 */
export type AuditAction = (typeof AUDIT_ACTION_VALUES)[number];

/** 判断字符串是否为合法 `audit_action`。 */
export function isAuditAction(value: string): value is AuditAction {
  return (AUDIT_ACTION_VALUES as readonly string[]).includes(value);
}
