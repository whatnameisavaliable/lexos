import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface UploadLeaveAlertDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirmLeave: () => void;
}

/**
 * 上传进行中离开确认（`ui_design.md` §6.3.4.2）。
 */
export function UploadLeaveAlertDialog({
  open,
  onOpenChange,
  onConfirmLeave,
}: UploadLeaveAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认离开</AlertDialogTitle>
          <AlertDialogDescription>
            当前有大文件正在上传，离开页面将中断传输。确定离开吗？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>继续上传</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirmLeave();
            }}
          >
            确定离开
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
