/**
 * BEXA AI — Settings API
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { profile, supabase, error } = await requireAuth(request, "ADMIN");

  if (error) {
    return NextResponse.json({ error }, { status: profile ? 403 : 401 });
  }

  try {
    const { data: settings, error: fetchError } = await supabase
      .from("settings")
      .select("key, value, type, description, is_public")
      .order("key");

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ settings: settings || [] });
  } catch (err) {
    console.error("Settings API error:", err);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { profile, supabase, error } = await requireAuth(request, "ADMIN");

  if (error) {
    return NextResponse.json({ error }, { status: profile ? 403 : 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.settings) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { settings } = body;

  try {
    // Update each setting — only if it exists
    for (const [key, value] of Object.entries(settings)) {
      // Check if setting exists
      const { data: existing } = await supabase
        .from("settings")
        .select("key, is_public")
        .eq("key", key)
        .single();

      // For ADMIN, only update non-public settings (don't expose secrets)
      if (existing && !(existing as any).is_public && (profile as any)?.role === "ADMIN") {
        const { error: updateError } = await (supabase as any)
          .from("settings")
          .update({
            value: String(value || ""),
            updated_by: (profile as any)?.id,
            updated_at: new Date().toISOString(),
          })
          .eq("key", key);

        if (updateError) {
          console.error(`Failed to update setting ${key}:`, updateError);
        }
      }
    }

    // Log activity
    await (supabase as any).from("activity_log").insert({
      actor_id: (profile as any).id,
      action: "settings.updated",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Settings update error:", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
