import { redirect } from "next/navigation";

/** MFA 首期已移除；旧链接重定向首页。 */
export default function MfaSetupRedirectPage() {
  redirect("/login");
}
