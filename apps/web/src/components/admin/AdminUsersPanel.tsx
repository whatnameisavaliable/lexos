"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminUserListItem } from "@lexos/shared";
import { listUsers } from "@/lib/admin-users-api";
import { toApiClientError } from "@/lib/api-client";
import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { DisableUserAlertDialog } from "@/components/admin/disable-user-alert-dialog";
import { EditUserDialog } from "@/components/admin/edit-user-dialog";
import { EnableUserAlertDialog } from "@/components/admin/enable-user-alert-dialog";
import { ResetPasswordAlertDialog } from "@/components/admin/reset-password-alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const PAGE_LIMIT = "50";

/** 管理员用户管理主面板。 */
export function AdminUsersPanel() {
  const [items, setItems] = useState<readonly AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [appliedQ, setAppliedQ] = useState<string | undefined>();
  const [cursor, setCursor] = useState<string | undefined>();
  const [cursorStack, setCursorStack] = useState<readonly string[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  const [editUser, setEditUser] = useState<AdminUserListItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [disableUser, setDisableUser] = useState<AdminUserListItem | null>(null);
  const [disableOpen, setDisableOpen] = useState(false);
  const [enableUser, setEnableUser] = useState<AdminUserListItem | null>(null);
  const [enableOpen, setEnableOpen] = useState(false);
  const [resetUser, setResetUser] = useState<AdminUserListItem | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const load = useCallback(async (opts?: { cursor?: string; q?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listUsers({
        limit: PAGE_LIMIT,
        cursor: opts?.cursor,
        q: opts?.q,
      });
      setItems(data.items);
      setNextCursor(data.meta.nextCursor);
    } catch (err) {
      setError(toApiClientError(err).message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load({ cursor, q: appliedQ });
  }, [load, cursor, appliedQ]);

  function refresh() {
    void load({ cursor, q: appliedQ });
  }

  function applySearch() {
    const q = search.trim() || undefined;
    setAppliedQ(q);
    setCursor(undefined);
    setCursorStack([]);
  }

  function goNextPage() {
    if (!nextCursor) {
      return;
    }
    setCursorStack((prev) => [...prev, cursor ?? ""]);
    setCursor(nextCursor);
  }

  function goPrevPage() {
    if (cursorStack.length === 0) {
      setCursor(undefined);
      return;
    }
    const stack = [...cursorStack];
    const prev = stack.pop();
    setCursorStack(stack);
    setCursor(prev || undefined);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">用户管理</h1>
        <CreateUserDialog onCreated={() => refresh()} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="max-w-xs"
          placeholder="搜索用户名或姓名"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              applySearch();
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={applySearch}>
          搜索
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          <p>暂无用户数据</p>
          <CreateUserDialog onCreated={() => refresh()} />
        </div>
      ) : (
        <AdminUsersTable
          items={items}
          onEdit={(user) => {
            setEditUser(user);
            setEditOpen(true);
          }}
          onToggleStatus={(user) => {
            if (user.status === "enabled") {
              setDisableUser(user);
              setDisableOpen(true);
            } else {
              setEnableUser(user);
              setEnableOpen(true);
            }
          }}
          onResetPassword={(user) => {
            setResetUser(user);
            setResetOpen(true);
          }}
        />
      )}

      {!loading && !error && items.length > 0 ? (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={cursorStack.length === 0 && !cursor}
            onClick={goPrevPage}
          >
            上一页
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!nextCursor}
            onClick={goNextPage}
          >
            下一页
          </Button>
        </div>
      ) : null}

      <EditUserDialog
        user={editUser}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={() => {
          toast.success("用户资料已更新");
          refresh();
        }}
      />
      <DisableUserAlertDialog
        user={disableUser}
        open={disableOpen}
        onOpenChange={setDisableOpen}
        onDone={() => {
          toast.success("用户已禁用");
          refresh();
        }}
      />
      <EnableUserAlertDialog
        user={enableUser}
        open={enableOpen}
        onOpenChange={setEnableOpen}
        onDone={() => {
          toast.success("用户已启用");
          refresh();
        }}
      />
      <ResetPasswordAlertDialog
        user={resetUser}
        open={resetOpen}
        onOpenChange={setResetOpen}
        onDone={() => {
          toast.success("密码已重置", {
            description:
              "请使用 AUTH_INITIAL_PASSWORD（.env 配置的初始密码）登录，勿使用重置前的旧密码；登录后将进入强制改密页。",
            duration: 12_000,
          });
          refresh();
        }}
      />
    </div>
  );
}
