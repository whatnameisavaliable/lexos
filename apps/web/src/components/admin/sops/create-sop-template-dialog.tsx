"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { ZodError } from "zod";
import {
  parseAdminSopTemplateCreateBody,
  type AdminSopTemplateCreateBody,
} from "@lexos/shared";
import { applyZodErrors } from "@/lib/validation/apply-zod-errors";
import { createAdminSopTemplate } from "@/lib/admin-sops-api";
import { toApiClientError } from "@/lib/api-client";
import { adminSopVersionEditorPath } from "@/components/admin/sops/sop-version-editor-utils";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface CreateSopTemplateDialogProps {
  readonly onCreated?: () => void;
}

/** 新建 SOP 逻辑模板对话框。 */
export function CreateSopTemplateDialog({ onCreated }: CreateSopTemplateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AdminSopTemplateCreateBody>({
    defaultValues: { name: "", caseType: "" },
  });

  async function onSubmit(raw: AdminSopTemplateCreateBody) {
    setSubmitting(true);
    setError(null);
    let body: AdminSopTemplateCreateBody;
    try {
      body = parseAdminSopTemplateCreateBody(raw);
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
      const created = await createAdminSopTemplate(body);
      setOpen(false);
      form.reset();
      onCreated?.();
      toast.success(`已创建模板「${body.name}」`);
      router.push(adminSopVersionEditorPath(created.versionId));
    } catch (err) {
      setError(toApiClientError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>新建模板</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建 SOP 模板</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>模板名称</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="例如：民事一审" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="caseType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>案件类型</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="例如：civil" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error ? (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "创建中…" : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
