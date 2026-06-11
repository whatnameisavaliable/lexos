import { handleApiError, ok } from "@/lib/api/http";
import { requireInternalSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await requireInternalSession();

    return ok({
      user: {
        id: session.userId,
        username: session.username,
        displayName: session.displayName,
        role: session.roleCode,
        rankCode: session.rankCode,
        mustChangePassword: session.mustChangePassword,
        status: "active",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
