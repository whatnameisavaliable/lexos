import { Badge } from "@/components/ui/badge";

/** MFA 绑定状态（读 `profiles.mfa_enabled`，`ui_design.md` §6.2.1）。 */
export function UserMfaBadge({ mfaEnabled }: { readonly mfaEnabled: boolean }) {
  return mfaEnabled ? (
    <Badge variant="secondary">已绑定</Badge>
  ) : (
    <Badge variant="outline">未绑定</Badge>
  );
}
