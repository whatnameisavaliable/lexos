"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { ZodError } from "zod";
import { parseAdminUserCreateBody, type AdminUserCreateBody } from "@lexos/shared";
import { applyZodErrors } from "@/lib/validation/apply-zod-errors";
import { createUser } from "@/lib/admin-users-api";
import { toApiClientError } from "@/lib/api-client";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "@/components/admin/role-labels";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CreateUserDialogProps {
  readonly onCreated: () => void;
}

/** 管理员创建用户对话框。 */
export function CreateUserDialog({ onCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AdminUserCreateBody>({
    defaultValues: {
      username: "",
      displayName: "",
      role: "lawyer",
      contact: "",
    },
  });

  async function onSubmit(raw: AdminUserCreateBody) {
    setSubmitting(true);
    setError(null);
    let body: AdminUserCreateBody;
    try {
      body = parseAdminUserCreateBody({
        ...raw,
        contact: raw.contact?.trim() ? raw.contact.trim() : undefined,
      });
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ZodError) {
        applyZodErrors(err, form.setError);
        return;
      }
      setError(toApiClientError(err).message);
      return;
    }
    try {
      await createUser(body);
      setOpen(false);
      form.reset();
      onCreated();
    } catch (err) {
      setError(toApiClientError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">创建用户</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>创建用户</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>用户名</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>真实姓名</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>角色</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择角色" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ASSIGNABLE_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>联系方式（可选）</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "提交中…" : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
