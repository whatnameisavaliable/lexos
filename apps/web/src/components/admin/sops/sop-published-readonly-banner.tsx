import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

/** 已发布版本只读提示（`CONTEXT_SUMMARY.md` §6.1）。 */
export function SopPublishedReadonlyBanner({
  isPublished,
}: {
  readonly isPublished: boolean;
}) {
  if (!isPublished) {
    return null;
  }

  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>只读版本</AlertTitle>
      <AlertDescription>已发布只读，请新建版本草稿</AlertDescription>
    </Alert>
  );
}
