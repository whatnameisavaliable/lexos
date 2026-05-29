import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="auth-layout">
      <Card className="w-full max-w-[420px]">
        <CardHeader>
          <CardTitle>登录 LexOS</CardTitle>
          <CardDescription>使用用户名与密码登录</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
