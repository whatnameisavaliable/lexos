import { Badge } from "@/components/ui/badge";
import type { UserStatus } from "@/types/user";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  UserStatus,
  { label: string; className: string }
> = {
  active: {
    label: "正常",
    className: "bg-emerald-500/15 text-emerald-800 border-emerald-200",
  },
  disabled: {
    label: "停用",
    className: "bg-amber-500/15 text-amber-900 border-amber-200",
  },
  resigned: {
    label: "离职",
    className: "bg-slate-500/15 text-slate-700 border-slate-200",
  },
  deleted: {
    label: "已删除",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const config = statusConfig[status];
  return (
    <Badge
      variant="outline"
      className={cn("font-normal", config.className)}
    >
      {config.label}
    </Badge>
  );
}
