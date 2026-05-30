import type { DriveNodeSummary } from "@lexos/shared";
import { Badge } from "@/components/ui/badge";

export interface ArchiveFolderBadgeProps {
  readonly node: Pick<DriveNodeSummary, "nodeType" | "isArchiveFolder">;
}

/** 归档目录标识（`ui_design.md` §6.4.2 · PRD 允许重命名）。 */
export function ArchiveFolderBadge({ node }: ArchiveFolderBadgeProps) {
  if (node.nodeType !== "folder" || !node.isArchiveFolder) {
    return null;
  }
  return (
    <Badge variant="secondary" className="font-normal">
      转写归档
    </Badge>
  );
}
