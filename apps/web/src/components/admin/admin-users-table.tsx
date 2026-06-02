"use client";

import type { AdminUserListItem } from "@lexos/shared";
import { BUILTIN_ADMIN_USERNAME } from "@lexos/shared/config";
import { MoreHorizontal } from "lucide-react";
import { ROLE_LABELS } from "@/components/admin/role-labels";
import { UserStatusBadge } from "@/components/admin/user-status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "short",
  timeStyle: "short",
});

export interface AdminUsersTableProps {
  readonly items: readonly AdminUserListItem[];
  readonly onEdit: (user: AdminUserListItem) => void;
  readonly onToggleStatus: (user: AdminUserListItem) => void;
  readonly onResetPassword: (user: AdminUserListItem) => void;
}

/** 用户管理数据表（`ui_design.md` §6.2 / §6.5）。 */
export function AdminUsersTable({
  items,
  onEdit,
  onToggleStatus,
  onResetPassword,
}: AdminUsersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="h-9">
          <TableHead>用户名</TableHead>
          <TableHead>真实姓名</TableHead>
          <TableHead>角色</TableHead>
          <TableHead className="text-center">状态</TableHead>
          <TableHead>创建时间</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((user) => (
          <TableRow key={user.id} className="h-10 text-sm">
            <TableCell className="font-medium">{user.username}</TableCell>
            <TableCell>{user.displayName}</TableCell>
            <TableCell>{ROLE_LABELS[user.role]}</TableCell>
            <TableCell className="text-center">
              <UserStatusBadge status={user.status} />
            </TableCell>
            <TableCell>{dateFormatter.format(new Date(user.createdAt))}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon-sm">
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">操作</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(user)}>
                    编辑
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={
                      user.status === "enabled" &&
                      user.username === BUILTIN_ADMIN_USERNAME
                    }
                    onClick={() => onToggleStatus(user)}
                  >
                    {user.status === "enabled" ? "禁用" : "启用"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onResetPassword(user)}>
                    重置密码
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
