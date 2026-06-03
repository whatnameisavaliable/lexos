import type { SopPublishedTemplateItem } from "@lexos/shared";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreatePipelineFromTemplateDialog } from "./create-pipeline-from-template-dialog";

export interface SopPublishedTemplatesTableProps {
  readonly items: readonly SopPublishedTemplateItem[];
  readonly onPipelineCreated?: () => void;
}

/** 已发布 SOP 模板列表。 */
export function SopPublishedTemplatesTable({
  items,
  onPipelineCreated,
}: SopPublishedTemplatesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>模板名称</TableHead>
          <TableHead>案由类型</TableHead>
          <TableHead>版本号</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.templateVersionId}>
            <TableCell>{item.templateName}</TableCell>
            <TableCell>{item.caseType}</TableCell>
            <TableCell>v{item.versionNumber}</TableCell>
            <TableCell className="text-right">
              <CreatePipelineFromTemplateDialog
                templateVersionId={item.templateVersionId}
                templateName={item.templateName}
                onCreated={onPipelineCreated}
                trigger={
                  <Button type="button" size="sm" variant="default">
                    新建流水线
                  </Button>
                }
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
