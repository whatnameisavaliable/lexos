import { NextResponse } from "next/server";

import { logStructured } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      logStructured({
        level: "warn",
        message: "sign-out failed",
        meta: { details: error.message },
      });
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    logStructured({
      level: "error",
      message: "sign-out route error",
      meta: { err: String(err) },
    });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
