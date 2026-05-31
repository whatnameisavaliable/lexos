import { AuditLogsTable } from "@/components/admin/audit-logs-table";

/** 管理员 — 审计日志（只读，`ui_design.md` §5.1 · §6.5）。 */
export default function AdminAuditPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">审计日志</h1>
        <p className="text-sm text-muted-foreground">
          合规审计只读查询；展示客户端与服务端时间戳。
        </p>
      </div>
      <AuditLogsTable />
    </div>
  );
}
