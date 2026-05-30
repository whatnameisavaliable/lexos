"use client";

import { useState } from "react";
import { parseDriveFolderCreateBody } from "@lexos/shared";
import { ZodError } from "zod";
import { createDriveFolder } from "@/lib/drive-api";
import { toApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export interface CreateFolderDialogProps {
  readonly parentId: string;
  readonly onCreated: () => void;
}

/** 新建文件夹对话框。 */
export function CreateFolderDialog({
  parentId,
  onCreated,
}: CreateFolderDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const body = parseDriveFolderCreateBody({ parentId, name });
      await createDriveFolder(body);
      toast.success("文件夹已创建");
      setOpen(false);
      setName("");
      onCreated();
    } catch (err) {
      if (err instanceof ZodError) {
        setError("请输入有效的文件夹名称");
      } else {
        setError(toApiClientError(err).message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">新建文件夹</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建文件夹</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          <Label htmlFor="drive-folder-name">名称</Label>
          <Input
            id="drive-folder-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入文件夹名称"
            disabled={submitting}
          />
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
          >
            {submitting ? "创建中…" : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
