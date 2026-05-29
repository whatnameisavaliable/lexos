"use client";

import { useState } from "react";
import type { AdminUserListItem } from "@lexos/shared";
import { setUserStatus } from "@/lib/admin-users-api";
import { toApiClientError } from "@/lib/api-client";
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

export interface DisableUserAlertDialogProps {
  readonly user: AdminUserListItem | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onDone: () => void;
}

/** 禁用用户二次确认。 */
export function DisableUserAlertDialog({
  user,
  open,
  onOpenChange,
  onDone,
}: DisableUserAlertDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!user) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await setUserStatus(user.id, { status: "disabled" });
      onOpenChange(false);
      onDone();
    } catch (err) {
      setError(toApiClientError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>禁用用户</AlertDialogTitle>
          <AlertDialogDescription>
            确定禁用用户「{user?.displayName}」（{user?.username}）？禁用后将立即吊销其所有会话，且无法再次登录。
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>取消</AlertDialogCancel>
          <AlertDialogAction
            disabled={submitting || !user}
            onClick={(e) => {
              e.preventDefault();
              void confirm();
            }}
          >
            {submitting ? "处理中…" : "确认禁用"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
