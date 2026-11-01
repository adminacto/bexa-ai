/**
 * BEXA AI — Auth check API
 * Returns current user session info.
 */

import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { Database } from "@/types/database";

const supabaseAdmin = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const supabase = await createServerClient();

  const { data, error } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    return NextResponse.json({ user: null });
  }

  // Fetch profile via service role (bypasses RLS for anon)
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: (profile as any).id,
      user_id: (profile as any).user_id,
      full_name: (profile as any).full_name,
      username: (profile as any).username,
      email: (profile as any).email,
      role: (profile as any).role,
      status: (profile as any).status,
      avatar_url: (profile as any).avatar_url,
      force_password_change: (profile as any).force_password_change,
    },
  });
}