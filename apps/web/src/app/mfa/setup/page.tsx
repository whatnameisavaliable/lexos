import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MfaVerifyForm } from "@/components/auth/mfa-verify-form";
import { SessionGuard } from "@/components/auth/session-guard";

export default function MfaSetupPage() {
  return (
    <SessionGuard>
      <div className="auth-layout">
        <Card className="w-full max-w-[420px]">
          <CardHeader>
            <CardTitle>绑定 MFA</CardTitle>
            <CardDescription>
              使用腾讯身份验证器或 Google Authenticator 扫描二维码
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MfaVerifyForm />
          </CardContent>
        </Card>
      </div>
    </SessionGuard>
  );
}
