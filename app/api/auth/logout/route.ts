/**
 * BEXA AI — Logout API Route
 */

import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database";

const supabaseAdmin = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Log activity
    await (supabaseAdmin as any).from("activity_log").insert({
      actor_id: user.id,
      action: "auth.logout",
    });
  }

  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}