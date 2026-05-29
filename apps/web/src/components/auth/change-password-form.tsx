"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  authChangePasswordBodySchema,
  type AuthChangePasswordBody,
} from "@lexos/shared";
import { changePassword, getSession } from "@/lib/auth-api";
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
 * 改密表单：强制改密无原密码；主动改密须原密码（`prd.md` §2.5.4）。
 */
export function ChangePasswordForm() {
  const router = useRouter();
  const [requiresChange, setRequiresChange] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AuthChangePasswordBody>({
    resolver: zodResolver(authChangePasswordBodySchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  useEffect(() => {
    void getSession()
      .then((s) => setRequiresChange(s.requiresPasswordChange))
      .catch(() => setRequiresChange(true));
  }, []);

  async function onSubmit(values: AuthChangePasswordBody) {
    setLoading(true);
    setError(null);
    try {
      await changePassword(values);
      const session = await getSession();
      const target = session.role === "admin" ? "/admin" : "/lawyer";
      router.replace(
        session.role === "admin" || session.role === "director"
          ? !session.mfaEnabled
            ? "/mfa/setup"
            : target
          : target,
      );
      router.refresh();
    } catch (err) {
      setError(toApiClientError(err).message);
    } finally {
      setLoading(false);
    }
  }

  if (requiresChange === null) {
    return (
      <div className="flex w-full max-w-[420px] flex-col gap-3">
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
          {!requiresChange ? (
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>当前密码</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>新密码</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "提交中…" : "确认修改"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
