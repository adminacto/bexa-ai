/**
 * BEXA AI — Collaborators API
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const { user, profile, supabase, error } = await requireAuth(request, "ADMIN");

  if (error) {
    return NextResponse.json({ error }, { status: profile ? 403 : 401 });
  }

  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20")));
  const search = searchParams.get("search") || "";
  const projectFilter = searchParams.get("project") || "all";
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from("project_members")
      .select(`
        id, project_id, user_id, role, responsibilities, start_date, revenue_share, created_at
      `, { count: "exact" });

    if (search) {
      query = query.or(
        `user.full_name.ilike.%${search}%,user.username.ilike.%${search}%,project.name.ilike.%${search}%,project.project_number.ilike.%${search}%`
      );
    }

    const { data: collaborators, error: fetchError, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Enrich with user and project info
    const enriched = await Promise.all(
      (collaborators || []).map(async (c: any) => {
        let user: any = null;
        if (c.user_id) {
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("id, full_name, username, email, role, status")
            .eq("id", c.user_id)
            .single();
          if (userProfile) user = userProfile;
        }

        let project: any = null;
        if (c.project_id) {
          const { data: projectData } = await supabase
            .from("projects")
            .select("id, project_number, name, total_revenue, total_expenses")
            .eq("id", c.project_id)
            .single();
          if (projectData) project = projectData;
        }

        return { ...c, user, project };
      })
    );

    return NextResponse.json({
      collaborators: enriched,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (err) {
    console.error("Collaborators API error:", err);
    return NextResponse.json(
      { error: "Failed to load collaborators" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { profile, supabase, error: authError } = await requireAuth(request, "ADMIN");
  if (authError) {
    return NextResponse.json({ error: authError }, { status: profile ? 403 : 401 });
  }

  const { project_id, user_id, role, responsibilities, start_date, revenue_share } = body;

  if (!project_id || !user_id) {
    return NextResponse.json(
      { error: "Project ID and User ID are required" },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await (supabase as any)
      .from("project_members")
      .insert({
        project_id,
        user_id,
        role: role || "contributor",
        responsibilities,
        start_date: start_date || new Date().toISOString().slice(0, 10),
        revenue_share,
        created_by: (profile as any).id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await (supabase as any).from("activity_log").insert({
      actor_id: (profile as any).id,
      action: "collaborator.added",
      entity_type: "project_member",
      entity_id: data.id,
      details: { project_id, user_id, role },
    });

    return NextResponse.json({ collaborator: data });
  } catch (err) {
    console.error("Create collaborator error:", err);
    return NextResponse.json(
      { error: "Failed to create collaborator" },
      { status: 500 }
    );
  }
}
