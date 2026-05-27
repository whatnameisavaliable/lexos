"use client";

import { Copy, UserPlus } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { UserStatusBadge } from "@/components/ui/user-status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CREATABLE_ROLES,
  type CreatableUserRole,
  type Profile,
  type UserStatus,
} from "@/types/user";
import type { ApiResponse } from "@/types/api";

const roleLabels: Record<CreatableUserRole, string> = {
  lawyer: "律师",
  client: "客户",
  channel_partner: "外部渠道商",
  director: "主任",
};

const roleDisplayLabels: Record<Profile["role"], string> = {
  admin: "管理员",
  lawyer: "律师",
  client: "客户",
  channel_partner: "外部渠道商",
  director: "主任",
};

export function AdminUsersPanel() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<CreatableUserRole>("lawyer");
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    const payload = (await res.json()) as ApiResponse<{ users: Profile[] }>;
    if (payload.ok) {
      setUsers(payload.data.users);
      setError(null);
    } else {
      setError(payload.error.message);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setResetUrl(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, role }),
      });
      const payload = (await res.json()) as ApiResponse<{
        resetUrl: string;
      }>;

      if (!payload.ok) {
        setError(payload.error.message);
        return;
      }

      setResetUrl(payload.data.resetUrl);
      setUsername("");
      await loadUsers();
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(userId: string, status: UserStatus) {
    await fetch(`/api/admin/users/${userId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadUsers();
  }

  async function issueReset(userId: string) {
    const res = await fetch(`/api/admin/users/${userId}/reset`, {
      method: "POST",
    });
    const payload = (await res.json()) as ApiResponse<{ resetUrl: string }>;
    if (payload.ok) {
      setResetUrl(payload.data.resetUrl);
      setCopied(false);
    }
  }

  async function repairUser(userId: string) {
    const res = await fetch(`/api/admin/users/${userId}/repair`, {
      method: "POST",
    });
    const payload = (await res.json()) as ApiResponse<{
      resetUrl: string;
      message?: string;
    }>;
    if (payload.ok) {
      setResetUrl(payload.data.resetUrl);
      setCopied(false);
      setError(null);
    } else {
      setError(payload.error.message);
    }
  }

  async function copyResetUrl() {
    if (!resetUrl) {
      return;
    }
    await navigator.clipboard.writeText(resetUrl);
    setCopied(true);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          用户管理
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          创建用户后生成一次性密码重置链接（60 分钟有效，单次使用）
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="size-4" />
            新建用户
          </CardTitle>
          <CardDescription>
            用户名将用于登录，仅支持英文字母与数字
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleCreate}
            className="grid gap-4 md:grid-cols-[1fr_180px_auto]"
          >
            <div className="space-y-2">
              <Label htmlFor="new-username">用户名</Label>
              <Input
                id="new-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="例如 lawyer01"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as CreatableUserRole)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CREATABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabels[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={loading}>
                {loading ? "创建中…" : "创建用户"}
              </Button>
            </div>
          </form>
          {error ? (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {resetUrl ? (
        <Alert>
          <AlertTitle>一次性重置链接</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p className="break-all font-mono text-xs">{resetUrl}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void copyResetUrl()}
            >
              <Copy className="size-4" />
              {copied ? "已复制" : "复制链接"}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">用户列表</CardTitle>
          <CardDescription>共 {users.length} 个账号</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">用户名</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="pr-6 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="pl-6 font-medium">
                    {user.username}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {roleDisplayLabels[user.role]}
                  </TableCell>
                  <TableCell>
                    <UserStatusBadge status={user.status} />
                  </TableCell>
                  <TableCell className="pr-6">
                    {user.username === "admin" ? (
                      <span className="text-xs text-muted-foreground">
                        内置账号
                      </span>
                    ) : (
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => void repairUser(user.id)}
                        >
                          修复登录
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void issueReset(user.id)}
                        >
                          重置链接
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => void updateStatus(user.id, "disabled")}
                        >
                          停用
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => void updateStatus(user.id, "resigned")}
                        >
                          离职
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => void updateStatus(user.id, "deleted")}
                        >
                          软删除
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
