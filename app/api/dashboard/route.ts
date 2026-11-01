/**
 * BEXA AI — Dashboard API
 * Returns real statistics from the database.
 */

import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database";

type DateRange = {
  from: Date;
  to: Date;
};

function resolveDateRange(range: string | null, from?: string, to?: string): DateRange | null {
  if (range === "custom" && from && to) {
    return { from: new Date(from), to: new Date(to) };
  }

  const now = new Date();

  switch (range) {
    case "today":
      return { from: now, to: now };
    case "last_7_days":
      const d7 = new Date(now);
      d7.setDate(d7.getDate() - 7);
      return { from: d7, to: now };
    case "last_30_days":
      const d30 = new Date(now);
      d30.setDate(d30.getDate() - 30);
      return { from: d30, to: now };
    case "this_month":
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: now,
      };
    default:
      return null; // all time
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "all_time";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const dateRange = resolveDateRange(range, from || undefined, to || undefined);
  const { user, profile, supabase, error } = await requireAuth(request, "ADMIN");

  if (error) {
    return NextResponse.json({ error }, { status: profile ? 403 : 401 });
  }

  try {
    // Build date filter
    const dateFilter = dateRange
      ? ` AND created_at >= '${dateRange.from.toISOString()}' AND created_at <= '${dateRange.to.toISOString()}'`
      : "";

    // Total users
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Total projects
    const { count: totalProjects } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true });

    // Active / completed projects
    const { count: activeProjects } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    const { count: completedProjects } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    // Total revenue and expenses (only completed transactions, exclude transfers as revenue)
    const { data: txnData, error: txnError } = await (supabase as any).rpc("get_financial_totals", {
      date_from: dateRange?.from.toISOString() || null,
      date_to: dateRange?.to.toISOString() || null,
    });

    // If RPC doesn't exist, use raw queries
    const { data: revenueData } = await supabase
      .from("transactions")
      .select("amount, type, status")
      .eq("status", "completed")
      .gte("date", dateRange?.from.toISOString() || "1970-01-01")
      .lte("date", dateRange?.to.toISOString() || new Date().toISOString());

    let totalRevenue = 0;
    let totalExpenses = 0;

    if (revenueData && !txnError) {
      for (const txn of revenueData as any[]) {
        if (txn.status === "completed") {
          if (txn.type === "revenue") {
            totalRevenue += txn.amount;
          } else if (txn.type === "expense") {
            totalExpenses += txn.amount;
          } else if (txn.type === "refund") {
            totalRevenue -= txn.amount; // refunds reduce revenue
          }
          // Transfers are NOT counted as revenue or expense
        }
      }
    }

    // Recent users (last 5)
    const { data: recentUsers } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, username, email, role, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    // Recent projects (last 5)
    const { data: recentProjects } = await supabase
      .from("projects")
      .select("id, project_number, name, description, owner_id, status, budget, total_revenue, total_expenses, start_date, deadline, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    // Revenue/expense by day for chart
    const { data: txnByDay } = await supabase
      .from("transactions")
      .select("date, amount, type, status")
      .eq("status", "completed")
      .gte("date", dateRange?.from.toISOString() || new Date(Date.now() - 30 * 86400000).toISOString())
      .lte("date", dateRange?.to.toISOString() || new Date().toISOString())
      .order("date", { ascending: true });

    // Build chart data — group by day
    const dayMap = new Map<string, { date: string; revenue: number; expenses: number }>();

    if (txnByDay) {
      for (const txn of txnByDay as any[]) {
        const day = new Date(txn.date).toISOString().slice(0, 10);
        if (!dayMap.has(day)) {
          dayMap.set(day, { date: day, revenue: 0, expenses: 0 });
        }
        const entry = dayMap.get(day)!;
        if (txn.type === "revenue") entry.revenue += txn.amount;
        else if (txn.type === "expense") entry.expenses += txn.amount;
        else if (txn.type === "refund") entry.revenue -= txn.amount;
      }
    }

    const revenueByDay = Array.from(dayMap.values());

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalProjects: totalProjects || 0,
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      activeProjects: activeProjects || 0,
      completedProjects: completedProjects || 0,
      recentUsers: recentUsers || [],
      recentProjects: recentProjects || [],
      revenueByDay,
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
