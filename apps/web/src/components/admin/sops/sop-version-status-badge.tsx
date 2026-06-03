import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** 版本状态展示文案。 */
export function versionStatusLabel(isPublished: boolean): string {
  return isPublished ? "已发布" : "草稿";
}

/** SOP 模板版本状态 Badge。 */
export function SopVersionStatusBadge({
  isPublished,
  className,
}: {
  readonly isPublished: boolean;
  readonly className?: string;
}) {
  return (
    <Badge
      variant={isPublished ? "default" : "secondary"}
      className={cn(
        isPublished && "bg-primary/20 text-primary hover:bg-primary/20",
        className,
      )}
    >
      {versionStatusLabel(isPublished)}
    </Badge>
  );
}
