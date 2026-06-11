import { handleApiError, ok } from "@/lib/api/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const serverClient = await createSupabaseServerClient();

    if (serverClient) {
      await serverClient.auth.signOut();
    }

    return ok({ signedOut: true });
  } catch (error) {
    return handleApiError(error);
  }
}
