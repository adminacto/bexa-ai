/**
 * BEXA AI — Change Password API
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { current_password, new_password } = body;

  if (!current_password || !new_password) {
    return NextResponse.json(
      { error: "Current password and new password are required" },
      { status: 400 }
    );
  }

  if (new_password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const { user, profile, supabase, error } = await requireAuth(request);

  if (error) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    // Update password via Supabase auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    // Clear force_password_change flag
    await (supabase as any)
      .from("profiles")
      .update({
        force_password_change: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user!.id);

    // Log activity
    await (supabase as any).from("activity_log").insert({
      actor_id: user!.id,
      action: "auth.password_changed",
      details: { method: "manual" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Change password error:", err);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
