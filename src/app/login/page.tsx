"use client";

import { Scale } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usernameToEmail } from "@/lib/auth/username";
import { roleHomePath } from "@/lib/menus";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/types/user";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "account_inactive"
      ? "账号已停用或不可用"
      : null,
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const normalizedUsername = username.trim();
      const supabase = createClient();
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: usernameToEmail(normalizedUsername),
          password,
        });

      if (signInError) {
        setError(
          process.env.NODE_ENV === "development"
            ? `登录失败：${signInError.message}`
            : "用户名或密码错误",
        );
        return;
      }

      const userId = signInData.user?.id;
      if (!userId) {
        setError("登录失败");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, status, username")
        .eq("id", userId)
        .maybeSingle();

      if (profileError || !profile) {
        setError("无法读取用户资料");
        await supabase.auth.signOut();
        return;
      }

      const typedProfile = profile as Pick<
        Profile,
        "role" | "status" | "username"
      >;
      if (typedProfile.status !== "active") {
        setError("账号已停用或不可用");
        await supabase.auth.signOut();
        return;
      }

      router.replace(roleHomePath[typedProfile.role as UserRole]);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Scale className="size-6" aria-hidden />
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          LexOS 律所协作平台
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          安全、简洁的企业级法律工作空间
        </p>
      </div>

      <Card className="w-full max-w-md shadow-sm">
        <CardHeader>
          <CardTitle>登录</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="字母与数字"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? "登录中…" : "登录"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center text-muted-foreground">
          加载中…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
