"use client";

import { useState } from "react";
import type { AdminUserListItem } from "@lexos/shared";
import { resetPassword } from "@/lib/admin-users-api";
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

export interface ResetPasswordAlertDialogProps {
  readonly user: AdminUserListItem | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onDone: () => void;
}

/** 重置为初始密码并强制改密。 */
export function ResetPasswordAlertDialog({
  user,
  open,
  onOpenChange,
  onDone,
}: ResetPasswordAlertDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!user) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword(user.id);
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
          <AlertDialogTitle>重置密码</AlertDialogTitle>
          <AlertDialogDescription>
            将把用户「{user?.displayName}」（{user?.username}
            ）的密码重置为系统初始密码，并强制其在下次登录后修改密码；其所有已登录会话将被立即吊销。
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
            {submitting ? "处理中…" : "确认重置"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
