"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ZodError } from "zod";
import { parseAdminUserUpdateBody, type AdminUserUpdateBody } from "@lexos/shared";
import { applyZodErrors } from "@/lib/validation/apply-zod-errors";
import type { AdminUserListItem } from "@lexos/shared";
import { updateUser } from "@/lib/admin-users-api";
import { toApiClientError } from "@/lib/api-client";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "@/components/admin/role-labels";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

export interface EditUserDialogProps {
  readonly user: AdminUserListItem | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onUpdated: () => void;
}

/** 编辑用户资料（不含 username / status）。 */
export function EditUserDialog({
  user,
  open,
  onOpenChange,
  onUpdated,
}: EditUserDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AdminUserUpdateBody>({
    defaultValues: { displayName: "", role: "lawyer", contact: "" },
  });

  useEffect(() => {
    if (user && open) {
      form.reset({
        displayName: user.displayName,
        role: user.role,
        contact: user.contact ?? "",
      });
      setError(null);
    }
  }, [user, open, form]);

  async function onSubmit(raw: AdminUserUpdateBody) {
    if (!user) {
      return;
    }
    setSubmitting(true);
    setError(null);
    let body: AdminUserUpdateBody;
    try {
      body = parseAdminUserUpdateBody({
        displayName: raw.displayName,
        role: raw.role,
        contact: raw.contact === "" ? null : raw.contact,
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
      await updateUser(user.id, body);
      onOpenChange(false);
      onUpdated();
    } catch (err) {
      setError(toApiClientError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑用户 — {user?.username}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
                        <SelectValue />
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
                  <FormLabel>联系方式</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
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
              <Button type="submit" disabled={submitting || !user}>
                {submitting ? "保存中…" : "保存"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
