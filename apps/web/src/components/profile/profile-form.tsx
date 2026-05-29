"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { profileUpdateBodySchema, type ProfileUpdateBody } from "@lexos/shared";
import { getProfile, updateProfile } from "@/lib/profile-api";
import { toApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 个人资料展示与编辑（仅 `displayName` / `contact`）。
 */
export function ProfileForm() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readonly, setReadonly] = useState<{
    username: string;
    role: string;
  } | null>(null);

  const form = useForm<ProfileUpdateBody>({
    resolver: zodResolver(profileUpdateBodySchema),
    defaultValues: { displayName: "", contact: "" },
  });

  useEffect(() => {
    void getProfile()
      .then((p) => {
        setReadonly({
          username: p.username,
          role: p.role,
        });
        form.reset({
          displayName: p.displayName,
          contact: p.contact ?? "",
        });
      })
      .catch((err) => setError(toApiClientError(err).message))
      .finally(() => setLoading(false));
  }, [form]);

  async function onSubmit(values: ProfileUpdateBody) {
    setError(null);
    try {
      await updateProfile(values);
    } catch (err) {
      setError(toApiClientError(err).message);
    }
  }

  if (loading) {
    return (
      <div className="flex max-w-lg flex-col gap-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (!readonly) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error ?? "无法加载个人资料"}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-lg">
      <dl className="mb-6 grid grid-cols-2 gap-2 text-sm">
        <dt className="text-muted-foreground">用户名</dt>
        <dd>{readonly.username}</dd>
        <dt className="text-muted-foreground">角色</dt>
        <dd>{readonly.role}</dd>
      </dl>

      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

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
          <Button type="submit">保存</Button>
        </form>
      </Form>

      <section className="mt-8 border-t border-border pt-6">
        <h2 className="text-lg font-medium">安全</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          修改登录密码须验证当前密码。忘记密码请联系系统管理员重置。
        </p>
        <Button type="button" variant="outline" className="mt-4" asChild>
          <Link href="/change-password">修改密码</Link>
        </Button>
      </section>
    </div>
  );
}
