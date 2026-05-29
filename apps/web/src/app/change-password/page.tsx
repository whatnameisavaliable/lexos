import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { SessionGuard } from "@/components/auth/session-guard";

export default function ChangePasswordPage() {
  return (
    <SessionGuard>
      <div className="auth-layout">
        <Card className="w-full max-w-[420px]">
          <CardHeader>
            <CardTitle>修改密码</CardTitle>
            <CardDescription>
              管理员创建或重置密码后须在此完成改密；个人中心也可主动修改密码。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </SessionGuard>
  );
}
