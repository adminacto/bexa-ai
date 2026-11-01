/**
 * BEXA AI — Project Detail API
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { profile, supabase, error } = await requireAuth(request, "ADMIN");

  if (error) {
    return NextResponse.json({ error }, { status: profile ? 403 : 401 });
  }

  try {
    // Main project info
    const { data: project, error: projError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single() as any;

    if (projError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch owner info
    let owner: any = null;
    if (project.owner_id) {
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("id, full_name, username, email, role, status, avatar_url")
        .eq("id", project.owner_id)
        .single();
      if (ownerProfile) owner = ownerProfile;
    }
    project.owner = owner;

    // Project members
    const { data: membersRaw } = await supabase
      .from("project_members")
      .select("*")
      .eq("project_id", id);

    const members = await Promise.all(
      (membersRaw || []).map(async (m: any) => {
        let user: any = null;
        if (m.user_id) {
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("id, full_name, username, email, role, status, avatar_url")
            .eq("id", m.user_id)
            .single();
          if (userProfile) user = userProfile;
        }
        return { ...m, user };
      })
    );

    // Transactions related to project
    const { data: transactionsRaw } = await supabase
      .from("transactions")
      .select("*")
      .eq("project_id", id)
      .order("date", { ascending: false });

    const transactions = await Promise.all(
      (transactionsRaw || []).map(async (t: any) => {
        let user: any = null;
        if (t.user_id) {
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("id, full_name, username")
            .eq("id", t.user_id)
            .single();
          if (userProfile) user = userProfile;
        }
        let creator: any = null;
        if (t.authorized_creator) {
          const { data: creatorProfile } = await supabase
            .from("profiles")
            .select("id, full_name, username")
            .eq("id", t.authorized_creator)
            .single();
          if (creatorProfile) creator = creatorProfile;
        }
        return { ...t, user, creator };
      })
    );

    // Activity log
    const { data: activityRaw } = await supabase
      .from("activity_log")
      .select("*")
      .eq("entity_type", "project")
      .eq("entity_id", id)
      .order("created_at", { ascending: false });

    const activity = await Promise.all(
      (activityRaw || []).map(async (a: any) => {
        let actor: any = null;
        if (a.actor_id) {
          const { data: actorProfile } = await supabase
            .from("profiles")
            .select("id, full_name, username")
            .eq("id", a.actor_id)
            .single();
          if (actorProfile) actor = actorProfile;
        }
        return { ...a, actor };
      })
    );

    // Financial totals
    let totalRevenue = 0;
    let totalExpenses = 0;
    for (const txn of transactions || []) {
      if (txn.status === "completed") {
        if (txn.type === "revenue") totalRevenue += txn.amount;
        else if (txn.type === "expense") totalExpenses += txn.amount;
        else if (txn.type === "refund") totalRevenue -= txn.amount;
      }
    }

    return NextResponse.json({
      project,
      members: members || [],
      transactions: transactions || [],
      activity: activity || [],
      financial_summary: {
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_profit: totalRevenue - totalExpenses,
        budget: project.budget || 0,
        budget_utilization: project.budget > 0
          ? ((totalRevenue + totalExpenses) / project.budget) * 100
          : 0,
      },
    });
  } catch (err) {
    console.error("Project detail API error:", err);
    return NextResponse.json(
      { error: "Failed to load project" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { profile, supabase, error } = await requireAuth(request, "ADMIN");

  if (error) {
    return NextResponse.json({ error }, { status: profile ? 403 : 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { name, description, owner_id, status, start_date, deadline, budget } = body;

  try {
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (owner_id) updateData.owner_id = owner_id;
    if (status) updateData.status = status;
    if (start_date) updateData.start_date = start_date;
    if (deadline) updateData.deadline = deadline;
    if (budget !== undefined) updateData.budget = parseFloat(budget);

    const { data, error: updateError } = await (supabase as any)
      .from("projects")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Log activity
    await (supabase as any).from("activity_log").insert({
      actor_id: (profile as any).id,
      action: "project.updated",
      entity_type: "project",
      entity_id: id,
      details: { changes: updateData },
    });

    return NextResponse.json({ project: data });
  } catch (err) {
    console.error("Update project error:", err);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { profile, supabase, error } = await requireAuth(request, "OWNER");

  if (error) {
    return NextResponse.json({ error }, { status: profile ? 403 : 401 });
  }

  try {
    // Soft-delete: mark as cancelled instead of hard delete
    const { data, error: updateError } = await (supabase as any)
      .from("projects")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    await (supabase as any).from("activity_log").insert({
      actor_id: (profile as any).id,
      action: "project.deleted",
      entity_type: "project",
      entity_id: id,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete project error:", err);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
