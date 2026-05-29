import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="auth-layout">
      <div className="flex w-full max-w-md flex-col gap-4">
        <Alert variant="destructive">
          <AlertTitle>无访问权限</AlertTitle>
          <AlertDescription>
            当前账号无权访问该页面。律师账号无法进入管理后台；如有疑问请联系系统管理员。
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/lawyer">返回工作台</Link>
        </Button>
      </div>
    </div>
  );
}
