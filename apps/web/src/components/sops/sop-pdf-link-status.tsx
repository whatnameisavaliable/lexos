import { Badge } from "@/components/ui/badge";

export interface SopPdfLinkStatusProps {
  readonly linkedDriveNodeId: string | null;
}

/** 云盘 PDF 链接状态（只读展示）。 */
export function SopPdfLinkStatus({ linkedDriveNodeId }: SopPdfLinkStatusProps) {
  const linked = linkedDriveNodeId !== null && linkedDriveNodeId.length > 0;
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">PDF 云盘：</span>
      {linked ? (
        <>
          <Badge variant="default">已关联</Badge>
          <span className="font-mono text-xs">{linkedDriveNodeId}</span>
          <span className="text-muted-foreground">
            请在「个人云盘」中查看对应节点
          </span>
        </>
      ) : (
        <Badge variant="outline">未关联</Badge>
      )}
    </div>
  );
}
