/**
 * BEXA AI — Login API Route (cookie-based)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/types/database";

const loginSchema = z.object({
  login: z.string().min(1, "Login is required"),
  password: z.string().min(1, "Password is required"),
});

const supabaseAdmin = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = loginSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { login, password } = result.data;

  // Resolve login (accepts email OR username)
  let email = login;
  if (!login.includes("@")) {
    const { data: profile, error: lookupError } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("username", login)
      .maybeSingle();

    if (lookupError || !profile) {
      return NextResponse.json({ error: "Invalid login or password" }, { status: 401 });
    }
    email = (profile as any).email;
  }

  const supabase = await createServerClient();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return NextResponse.json({ error: "Invalid login or password" }, { status: 401 });
  }

  // Fetch profile via service role
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if ((profile as any).status !== "active" && (profile as any).status !== "invited") {
    return NextResponse.json({ error: `Account is ${(profile as any).status}` }, { status: 403 });
  }

  // Update last login
  await (supabaseAdmin as any)
    .from("profiles")
    .update({ last_login: new Date().toISOString(), last_activity: new Date().toISOString() })
    .eq("id", (profile as any).id);

  // Log activity
  await (supabaseAdmin as any).from("activity_log").insert({
    actor_id: (profile as any).id,
    action: "auth.login",
    details: { method: "password" },
  });

  return NextResponse.json({
    success: true,
    user: {
      id: (profile as any).id,
      user_id: (profile as any).user_id,
      full_name: (profile as any).full_name,
      username: (profile as any).username,
      email: (profile as any).email,
      role: (profile as any).role,
      status: (profile as any).status,
      force_password_change: (profile as any).force_password_change,
    },
  });
}