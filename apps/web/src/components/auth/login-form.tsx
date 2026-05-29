"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { authLoginBodySchema, type AuthLoginBody } from "@lexos/shared";
import { getSession, login } from "@/lib/auth-api";
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
 * 登录表单（`ui_design.md` §6.1；首期无验证码）。
 */
export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AuthLoginBody>({
    resolver: zodResolver(authLoginBodySchema),
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(values: AuthLoginBody) {
    setLoading(true);
    setError(null);
    try {
      await login(values);
      const session = await getSession();
      if (session.requiresPasswordChange) {
        router.replace("/change-password");
      } else if (session.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/lawyer");
      }
      router.refresh();
    } catch (err) {
      const apiErr = toApiClientError(err);
      setError(apiErr.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex w-full max-w-[420px] flex-col gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px]">
      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>用户名</FormLabel>
                <FormControl>
                  <Input autoComplete="username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>密码</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">
            登录
          </Button>
        </form>
      </Form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        忘记密码请联系系统管理员重置
      </p>
    </div>
  );
}
