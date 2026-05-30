"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type TranscriptWorkbenchMode = "proofread" | "edit";

export interface TranscriptModeSwitchProps {
  readonly mode: TranscriptWorkbenchMode;
  readonly onModeChange: (mode: TranscriptWorkbenchMode) => void;
  readonly hasTimestamps: boolean;
}

/** 校对 / 编辑模式切换（§4.3.2.1）。 */
export function TranscriptModeSwitch({
  mode,
  onModeChange,
  hasTimestamps,
}: TranscriptModeSwitchProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isEdit = mode === "edit";

  function handleToggle(checked: boolean) {
    if (checked) {
      setConfirmOpen(true);
      return;
    }
    onModeChange("proofread");
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Switch
          id="transcript-mode-switch"
          checked={isEdit}
          onCheckedChange={handleToggle}
          disabled={!hasTimestamps && !isEdit}
        />
        <Label htmlFor="transcript-mode-switch" className="text-sm">
          {isEdit ? "编辑模式" : "校对模式"}
        </Label>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>切换到编辑模式？</AlertDialogTitle>
            <AlertDialogDescription>
              编辑模式仅修改润色文稿，不影响时间戳校对视图。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onModeChange("edit");
                setConfirmOpen(false);
              }}
            >
              继续
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
