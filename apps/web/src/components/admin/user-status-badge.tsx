import type { ProfileStatus } from "@lexos/shared";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<ProfileStatus, string> = {
  enabled: "启用",
  disabled: "禁用",
};

/** 用户状态 Badge（`ui_design.md` §2.2 / §6.2）。 */
export function UserStatusBadge({
  status,
  className,
}: {
  readonly status: ProfileStatus;
  readonly className?: string;
}) {
  const variant = status === "enabled" ? "default" : "destructive";
  return (
    <Badge
      variant={variant}
      className={cn(
        status === "enabled" && "bg-primary/20 text-primary hover:bg-primary/20",
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}
