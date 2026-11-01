/**
 * BEXA AI — Projects API
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

// Generate next project number
async function generateProjectNumber(supabase: any): Promise<string> {
  const { data, error } = await supabase
    .from("projects")
    .select("project_number")
    .order("project_number", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return "PRJ-1001";

  const lastNumber = parseInt(data[0].project_number.replace("PRJ-", ""), 10) || 1000;
  return `PRJ-${lastNumber + 1}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const { user, profile, supabase, error } = await requireAuth(request, "ADMIN");

  if (error) {
    return NextResponse.json({ error }, { status: profile ? 403 : 401 });
  }

  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20")));
  const search = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "all";
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from("projects")
      .select(`
        id, project_number, name, description, owner_id, status,
        start_date, deadline, budget, total_revenue, total_expenses,
        created_at, updated_at
      `);

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,project_number.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data: projects, error: fetchError, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Enrich with member count and owner name
    const enriched = await Promise.all(
      (projects || []).map(async (p: any) => {
        const { count: memberCount } = await supabase
          .from("project_members")
          .select("*", { count: "exact", head: true })
          .eq("project_id", p.id);

        let ownerName = "—";
        if (p.owner_id) {
          const { data: ownerProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", p.owner_id)
            .single();
          if (ownerProfile) {
            ownerName = (ownerProfile as any).full_name;
          }
        }

        return {
          ...p,
          owner_name: ownerName,
          net_profit: (p.total_revenue || 0) - (p.total_expenses || 0),
          member_count: memberCount || 0,
        };
      })
    );

    return NextResponse.json({
      projects: enriched,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (err) {
    console.error("Projects API error:", err);
    return NextResponse.json(
      { error: "Failed to load projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { profile, supabase, error } = await requireAuth(request, "ADMIN");

  if (error) {
    return NextResponse.json({ error }, { status: profile ? 403 : 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { name, description, owner_id, start_date, deadline, budget } = body;

  if (!name || !owner_id) {
    return NextResponse.json(
      { error: "Name and owner are required" },
      { status: 400 }
    );
  }

  try {
    const projectNumber = await generateProjectNumber(supabase);

    const { data, error: insertError } = await (supabase as any)
      .from("projects")
      .insert({
        project_number: projectNumber,
        name,
        description,
        owner_id,
        start_date: start_date || null,
        deadline: deadline || null,
        budget: budget || 0,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    // Log activity
    await (supabase as any).from("activity_log").insert({
      actor_id: (profile as any).id,
      action: "project.created",
      entity_type: "project",
      entity_id: data.id,
      details: { project_number: projectNumber, name },
    });

    return NextResponse.json({ project: data });
  } catch (err) {
    console.error("Create project error:", err);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
