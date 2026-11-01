/**
 * BEXA AI — User Detail API
 */

import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, profile, supabase, error } = await requireAuth(request, "ADMIN");

  if (error) {
    return NextResponse.json({ error }, { status: profile ? 403 : 401 });
  }

  try {
    const { data: targetUser, error: userError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get projects owned by this user
    const { data: ownedProjects } = await supabase
      .from("projects")
      .select("id, project_number, name, status, total_revenue, total_expenses, created_at")
      .eq("owner_id", id);

    // Get projects where user is a member
    const { data: memberships } = await supabase
      .from("project_members")
      .select("project_id, role, start_date, responsibilities, created_at")
      .eq("user_id", id);

    // Get member project details
    let memberProjects: any[] = [];
    if (memberships && memberships.length > 0) {
      for (const m of memberships as any[]) {
        const { data: proj } = await supabase
          .from("projects")
          .select("id, project_number, name, status, total_revenue, total_expenses")
          .eq("id", m.project_id)
          .single();
        if (proj) {
          memberProjects.push({
            ...(proj as any),
            member_role: m.role,
            responsibilities: m.responsibilities,
            start_date: m.start_date,
          });
        }
      }
    }

    // Get collaborator details (users who work on user's projects)
    let collaborators: any[] = [];
    for (const proj of (ownedProjects || []) as any[]) {
      const { data: members } = await supabase
        .from("project_members")
        .select("user_id, role, start_date")
        .eq("project_id", proj.id)
        .neq("user_id", id);

      for (const m of (members || []) as any[]) {
        const { data: collabProfile } = await supabase
          .from("profiles")
          .select("id, full_name, username, role, email")
          .eq("id", m.user_id)
          .single();

        if (collabProfile) {
          collaborators.push({
            ...(collabProfile as any),
            project: proj.project_number,
            role: m.role,
            start_date: m.start_date,
          });
        }
      }
    }

    // Get financial transactions
    const { data: transactions } = await supabase
      .from("transactions")
      .select("id, transaction_number, type, amount, currency, date, project_id, status, description")
      .eq("user_id", id)
      .order("date", { ascending: false });

    let totalRevenue = 0;
    let totalExpenses = 0;
    for (const txn of (transactions || []) as any[]) {
      if (txn.status === "completed") {
        if (txn.type === "revenue") totalRevenue += txn.amount;
        else if (txn.type === "expense") totalExpenses += txn.amount;
        else if (txn.type === "refund") totalRevenue -= txn.amount;
      }
    }

    // Get activity log
    const { data: activity } = await supabase
      .from("activity_log")
      .select("action, entity_type, details, created_at")
      .eq("actor_id", id)
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({
      user: targetUser,
      owned_projects: ownedProjects || [],
      member_projects: memberProjects || [],
      collaborators: collaborators || [],
      transactions: transactions || [],
      activity: activity || [],
      financial_summary: {
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_profit: totalRevenue - totalExpenses,
      },
    });
  } catch (err) {
    console.error("User detail API error:", err);
    return NextResponse.json(
      { error: "Failed to load user data" },
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

  // Prevent ADMIN from modifying OWNER
  if (profile) {
    const { data: targetUser } = await (supabase as any)
      .from("profiles")
      .select("role")
      .eq("id", id)
      .single();

    if ((targetUser as any)?.role === "OWNER" && (profile as any).role === "ADMIN") {
      return NextResponse.json(
        { error: "Cannot modify OWNER account" },
        { status: 403 }
      );
    }
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { status, full_name, username, email, role, force_password_change } = body;

  try {
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (status) updateData.status = status;
    if (full_name) updateData.full_name = full_name;
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (force_password_change !== undefined) updateData.force_password_change = force_password_change;

    // Only OWNER can change roles
    if (role && (profile as any)?.role === "OWNER") {
      updateData.role = role;
    }

    const { data: updated, error: updateError } = await (supabase as any)
      .from("profiles")
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
      action: "user.updated",
      entity_type: "user",
      entity_id: id,
      details: { changes: updateData },
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error("User update error:", err);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}