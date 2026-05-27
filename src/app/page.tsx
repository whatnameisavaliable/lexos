import Link from "next/link";
import { Scale } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  const connected = !error;
  const signedIn = Boolean(data?.claims?.sub);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 px-6 py-16">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <Scale className="size-7" aria-hidden />
        </div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          LexOS
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          律所数字化转型协作平台 · 开发环境
        </p>
      </div>

      <Card className="w-full max-w-lg shadow-sm">
        <CardHeader>
          <CardTitle>系统状态</CardTitle>
          <CardDescription>基础设施连接自检</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Supabase API</dt>
              <dd
                className={
                  connected
                    ? "font-medium text-emerald-700"
                    : "font-medium text-destructive"
                }
              >
                {connected ? "已连接" : "连接失败"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">当前会话</dt>
              <dd className="font-medium">
                {signedIn ? "已登录" : "未登录"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">数据库迁移</dt>
              <dd className="font-mono text-xs">supabase db push</dd>
            </div>
          </dl>

          {error ? (
            <>
              <Separator />
              <p className="text-sm text-destructive">{error.message}</p>
            </>
          ) : null}

          <Separator />
          <Link
            href="/login"
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
          >
            前往登录
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
