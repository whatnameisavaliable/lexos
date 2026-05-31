import type { AuditAction } from "@lexos/shared";

/** 审计动作中文展示名。 */
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  "auth.login_success": "登录成功",
  "auth.login_failure": "登录失败",
  "auth.logout": "登出",
  "auth.password_change": "修改密码",
  "auth.password_reset": "重置密码",
  "user.create": "创建用户",
  "user.update": "更新用户/配置",
  "user.disable": "禁用用户",
  "user.enable": "启用用户",
  "ai.model.upsert": "AI 模型变更",
  "ai.mapping.upsert": "AI 映射变更",
  "ai.prompt.publish": "Prompt 发布",
  "task.create": "创建转写任务",
  "task.complete": "转写完成",
  "task.fail": "转写失败",
  "file.download": "文件下载",
  "file.delete": "文件删除",
  "file.export": "文件导出",
};
