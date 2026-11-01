/**
 * BEXA AI — Analytics API
 * Returns aggregated statistics for reports.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "year";

  const { profile, supabase, error } = await requireAuth(request, "ADMIN");

  if (error) {
    return NextResponse.json({ error }, { status: profile ? 403 : 401 });
  }

  try {
    // Compute date range
    const now = new Date();
    let dateFrom: Date;
    let dateTo = now;

    switch (range) {
      case "year":
        dateFrom = new Date(now.getFullYear(), 0, 1);
        break;
      case "6months":
        dateFrom = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case "3months":
        dateFrom = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case "all":
      default:
        dateFrom = new Date(0);
        break;
    }

    const dateFromStr = dateFrom.toISOString();
    const dateToStr = dateTo.toISOString();

    // Get all transactions in range
    const { data: allTransactions, error: txnError } = await supabase
      .from("transactions")
      .select("date, type, amount, status, user_id, project_id")
      .gte("date", dateFromStr)
      .lte("date", dateToStr);

    // Get all users
    const { data: allUsers, error: usersError } = await supabase
      .from("profiles")
      .select("id, created_at");

    // Get all projects
    const { data: allProjects, error: projectsError } = await supabase
      .from("projects")
      .select("id, project_number, name, total_revenue, total_expenses, created_at");

    // Get project members
    const { data: members, error: membersError } = await supabase
      .from("project_members")
      .select("project_id, user_id");

    // Build monthly revenue trend
    const monthlyData = new Map<string, { revenue: number; expenses: number; profit: number }>();

    for (const txn of (allTransactions || []) as any[]) {
      if (txn.status !== "completed") continue;
      const month = new Date(txn.date).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { revenue: 0, expenses: 0, profit: 0 });
      }
      const entry = monthlyData.get(month)!;
      if (txn.type === "revenue") entry.revenue += txn.amount;
      else if (txn.type === "expense") entry.expenses += txn.amount;
      else if (txn.type === "refund") entry.revenue -= txn.amount;
      // transfers are excluded
    }

    for (const [month, data] of monthlyData) {
      data.profit = data.revenue - data.expenses;
    }

    const months = Array.from(monthlyData.keys()).sort();
    const revenueTrend = months.map((month) => ({
      month,
      revenue: monthlyData.get(month)!.revenue,
      expenses: monthlyData.get(month)!.expenses,
      profit: monthlyData.get(month)!.profit,
    }));

    const monthlyProfit = months.map((month) => ({
      month,
      profit: monthlyData.get(month)!.profit,
    }));

    // User growth by month
    const userGrowthMap = new Map<string, { new_users: number; total_users: number }>();
    let runningTotal = 0;
    const sortedUsers = ((allUsers || []) as any[]).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    for (const u of sortedUsers) {
      const month = new Date(u.created_at).toISOString().slice(0, 7);
      if (!userGrowthMap.has(month)) {
        userGrowthMap.set(month, { new_users: 0, total_users: 0 });
      }
      userGrowthMap.get(month)!.new_users += 1;
      runningTotal += 1;
      userGrowthMap.get(month)!.total_users = runningTotal;
    }

    const userGrowth = Array.from(userGrowthMap.keys())
      .sort()
      .map((month) => ({
        month,
        new_users: userGrowthMap.get(month)!.new_users,
        total_users: userGrowthMap.get(month)!.total_users,
      }));

    // Project growth
    const projectGrowthMap = new Map<string, { new_projects: number; total_projects: number }>();
    let projTotal = 0;
    const sortedProjects = ((allProjects || []) as any[]).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    for (const p of sortedProjects) {
      const month = new Date(p.created_at).toISOString().slice(0, 7);
      if (!projectGrowthMap.has(month)) {
        projectGrowthMap.set(month, { new_projects: 0, total_projects: 0 });
      }
      projectGrowthMap.get(month)!.new_projects += 1;
      projTotal += 1;
      projectGrowthMap.get(month)!.total_projects = projTotal;
    }

    const projectGrowth = Array.from(projectGrowthMap.keys())
      .sort()
      .map((month) => ({
        month,
        new_projects: projectGrowthMap.get(month)!.new_projects,
        total_projects: projectGrowthMap.get(month)!.total_projects,
      }));

    // Most active users (by project count)
    const userProjectCount = new Map<string, number>();
    for (const m of (members || []) as any[]) {
      userProjectCount.set(m.user_id, (userProjectCount.get(m.user_id) || 0) + 1);
    }

    // Get user revenue
    const { data: userTxn } = await supabase
      .from("transactions")
      .select("user_id, amount, type, status")
      .eq("status", "completed");

    const userRevenue = new Map<string, number>();
    for (const txn of (userTxn || []) as any[]) {
      if (txn.type === "revenue") {
        userRevenue.set(
          txn.user_id,
          (userRevenue.get(txn.user_id) || 0) + txn.amount
        );
      } else if (txn.type === "refund") {
        userRevenue.set(
          txn.user_id,
          (userRevenue.get(txn.user_id) || 0) - txn.amount
        );
      }
    }

    // Get user profiles for top users
    const topUserIds = Array.from(userProjectCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);

    const { data: topUserProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, username, user_id")
      .in("id", topUserIds);

    const mostActiveUsers = ((topUserProfiles || []) as any[]).map((u) => ({
      user_id: u.id,
      full_name: u.full_name,
      username: u.username,
      project_count: userProjectCount.get(u.id) || 0,
      total_revenue: userRevenue.get(u.id) || 0,
    }));

    // Top projects by profit
    const projectsWithProfit = ((allProjects || []) as any[]).map((p) => ({
      project_number: p.project_number,
      name: p.name,
      net_profit: p.total_revenue - p.total_expenses,
      total_revenue: p.total_revenue,
      total_expenses: p.total_expenses,
    }));

    const topProjectsByProfit = projectsWithProfit
      .sort((a, b) => b.net_profit - a.net_profit)
      .slice(0, 10);

    const topProjectsByExpenses = projectsWithProfit
      .sort((a, b) => b.total_expenses - a.total_expenses)
      .slice(0, 10);

    // Summary
    let totalRevenue = 0;
    let totalExpenses = 0;
    for (const txn of (allTransactions || []) as any[]) {
      if (txn.status !== "completed") continue;
      if (txn.type === "revenue") totalRevenue += txn.amount;
      else if (txn.type === "expense") totalExpenses += txn.amount;
      else if (txn.type === "refund") totalRevenue -= txn.amount;
    }

    return NextResponse.json({
      revenueTrend,
      monthlyProfit,
      topProjectsByProfit,
      topProjectsByExpenses,
      mostActiveUsers,
      userGrowth,
      projectGrowth,
      summary: {
        total_users: allUsers?.length || 0,
        total_projects: allProjects?.length || 0,
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_profit: totalRevenue - totalExpenses,
      },
    });
  } catch (err) {
    console.error("Analytics API error:", err);
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 500 }
    );
  }
}
