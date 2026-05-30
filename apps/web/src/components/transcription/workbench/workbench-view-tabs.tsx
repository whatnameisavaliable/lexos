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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** 工作台右列视图：校对（ASR 源稿）· 润色编辑 · 摘要。 */
export type WorkbenchView = "proofread" | "edit" | "summary";

export interface WorkbenchViewTabsProps {
  readonly view: WorkbenchView;
  readonly onViewChange: (view: WorkbenchView) => void;
  readonly hasTimestamps: boolean;
  readonly hasSummary: boolean;
}

/** 右列 Tab 切换（`ui_design.md` §4.3.2 · 摘要只读扩展）。 */
export function WorkbenchViewTabs({
  view,
  onViewChange,
  hasTimestamps,
  hasSummary,
}: WorkbenchViewTabsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleTabChange(next: string) {
    const target = next as WorkbenchView;
    if (target === "edit" && view !== "edit") {
      setConfirmOpen(true);
      return;
    }
    onViewChange(target);
  }

  return (
    <>
      <Tabs value={view} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="proofread" disabled={!hasTimestamps}>
            校对
          </TabsTrigger>
          <TabsTrigger value="edit">润色编辑</TabsTrigger>
          {hasSummary ? <TabsTrigger value="summary">摘要</TabsTrigger> : null}
        </TabsList>
      </Tabs>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>切换到润色编辑？</AlertDialogTitle>
            <AlertDialogDescription>
              润色编辑修改 LLM 整理后的正文，不影响校对视图中的 ASR 源稿与时间戳。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onViewChange("edit");
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
