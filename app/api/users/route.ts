/**
 * BEXA AI — Users API (list with search, filter, sort, pagination)
 */

import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

type UserWithStats = {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  avatar_url?: string | null;
  created_at: string;
  last_login?: string | null;
  last_activity?: string | null;
  force_password_change: boolean;
  project_count: number;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
};

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
  const sortField = searchParams.get("sort") || "created_at";
  const sortOrder = (searchParams.get("order") || "desc").toUpperCase() as "ASC" | "DESC";

  const offset = (page - 1) * limit;

  try {
    // Build query
    let query = supabase
      .from("profiles")
      .select("id, user_id, full_name, username, email, phone, role, status, avatar_url, created_at, last_login, last_activity, force_password_change", { count: "exact" });

    // Search
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,username.ilike.%${search}%,user_id.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    // Sort
    const validSortFields = [
      "full_name", "username", "user_id", "created_at",
      "last_login", "role", "status",
    ];
    const sortColumn = validSortFields.includes(sortField) ? sortField : "created_at";
    query = query.order(sortColumn, { ascending: sortOrder === "ASC" });

    // Pagination
    const { data: users, error: fetchError, count } = await query.range(offset, offset + limit - 1);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Get stats for each user
    const enrichedUsers: UserWithStats[] = [];

    for (const u of (users || []) as any[]) {
      // Count projects owned by this user
      const { count: projectCount } = await (supabase as any)
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", u.id);

      // Count projects where user is a member
      const { data: memberships } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", u.id);

      const memberProjects = memberships?.length || 0;

      // Sum revenue from transactions
      const { data: txnData } = await supabase
        .from("transactions")
        .select("amount, type, status")
        .eq("user_id", u.id)
        .eq("status", "completed");

      let totalRevenue = 0;
      let totalExpenses = 0;
      for (const txn of (txnData || []) as any[]) {
        if (txn.type === "revenue") totalRevenue += txn.amount;
        else if (txn.type === "expense") totalExpenses += txn.amount;
        else if (txn.type === "refund") totalRevenue -= txn.amount;
      }

      enrichedUsers.push({
        id: u.id,
        user_id: u.user_id,
        full_name: u.full_name,
        username: u.username,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
        avatar_url: u.avatar_url,
        created_at: u.created_at,
        last_login: u.last_login,
        last_activity: u.last_activity,
        force_password_change: u.force_password_change,
        project_count: (projectCount || 0) + memberProjects,
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_profit: totalRevenue - totalExpenses,
      });
    }

    // For custom sort fields that require stats, re-sort
    if (sortField === "total_revenue" || sortField === "total_expenses" || sortField === "net_profit") {
      enrichedUsers.sort((a, b) => {
        const aVal = a[sortField as keyof typeof a] as number;
        const bVal = b[sortField as keyof typeof b] as number;
        return sortOrder === "ASC" ? aVal - bVal : bVal - aVal;
      });
    }

    return NextResponse.json({
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (err) {
    console.error("Users API error:", err);
    return NextResponse.json(
      { error: "Failed to load users" },
      { status: 500 }
    );
  }
}