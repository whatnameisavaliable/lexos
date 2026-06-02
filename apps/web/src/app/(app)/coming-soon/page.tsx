import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** 预留角色占位页（PRD-2-04 · OPEN_ISSUES accepted）。 */
export default function ComingSoonPage() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>功能尚未开放</CardTitle>
          <CardDescription>
            您的账户类型（主任 / 客户 / 渠道）暂无可用业务模块。您可前往
            <strong> 个人中心 </strong>
            查看资料或修改密码。如需开通权限，请联系系统管理员。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button type="button" asChild>
            <Link href="/profile">个人中心</Link>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/change-password">修改密码</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
