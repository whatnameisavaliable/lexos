import { redirect } from "next/navigation";

import {
  getCurrentProfile,
  isProfileLoginAllowed,
} from "@/lib/auth/session";
import { roleHomePath } from "@/lib/menus";
import type { UserRole } from "@/types/user";

export async function requireAuthProfile() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }
  if (!isProfileLoginAllowed(profile)) {
    redirect("/login?error=account_inactive");
  }
  return profile;
}

export async function requireRole(allowed: UserRole[]) {
  const profile = await requireAuthProfile();
  if (!allowed.includes(profile.role)) {
    redirect(roleHomePath[profile.role]);
  }
  return profile;
}
