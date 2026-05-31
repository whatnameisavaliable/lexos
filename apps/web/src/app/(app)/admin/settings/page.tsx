import { SystemSettingForm } from "@/components/admin/system-setting-form";

/** 管理员 — 系统设置（键值 JSON，`prd.md` §2.2）。 */
export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">系统设置</h1>
        <p className="text-sm text-muted-foreground">
          律所级非 AI 参数；密钥类配置请使用 AI 凭证管理。
        </p>
      </div>
      <SystemSettingForm />
    </div>
  );
}
