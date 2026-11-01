"use client";
/**
 * BEXA AI — Analytics & Reports page
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  BarChart3,
  Download,
  TrendingUp,
  DollarSign,
  Trophy,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import { toast } from "sonner";

type AnalyticsData = {
  revenueTrend: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
  monthlyProfit: Array<{ month: string; profit: number }>;
  topProjectsByProfit: Array<{ project_number: string; name: string; net_profit: number; total_revenue: number; total_expenses: number }>;
  topProjectsByExpenses: Array<{ project_number: string; name: string; total_expenses: number; total_revenue: number }>;
  mostActiveUsers: Array<{ user_id: string; full_name: string; username: string; project_count: number; total_revenue: number }>;
  userGrowth: Array<{ month: string; new_users: number; total_users: number }>;
  projectGrowth: Array<{ month: string; new_projects: number; total_projects: number }>;
  summary: {
    total_users: number;
    total_projects: number;
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
  };
};

const COLORS = ["#ffffff", "#6b7280", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("year");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${dateRange}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to load");
      setData(result);
    } catch (err) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const exportCSV = (section: string, rows: any[]) => {
    const headers = Object.keys(rows[0] || {});
    const csvContent =
      [headers.join(",")]
        .concat(
          rows.map((row) =>
            headers.map((h) => `"${(row[h] || "").toString().replace(/"/g, '""')}"`).join(",")
          )
        )
        .join("\n") + "\n";

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bexa-ai-${section}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading || !data) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-1/4 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-800 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-gray-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics & Reports</h1>
          <p className="text-sm text-gray-400">Business insights and financial reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="year">This Year</option>
            <option value="6months">Last 6 Months</option>
            <option value="3months">Last 3 Months</option>
            <option value="all">All Time</option>
          </Select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(data.summary.total_revenue)}
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-gray-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Expenses</p>
                <p className="text-2xl font-bold text-red-400">
                  {formatCurrency(data.summary.total_expenses)}
                </p>
              </div>
              <ArrowDownRight className="h-5 w-5 text-gray-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Net Profit</p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    data.summary.net_profit >= 0 ? "text-white" : "text-red-400"
                  )}
                >
                  {formatCurrency(data.summary.net_profit)}
                </p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-gray-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Users</p>
                <p className="text-2xl font-bold text-white">
                  {data.summary.total_users.toLocaleString()}
                </p>
              </div>
              <Users className="h-5 w-5 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Revenue vs Expenses Trend</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => exportCSV("revenue-trend", data.revenueTrend)}>
              <Download className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", color: "#fff" }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#ffffff" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#6b7280" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Monthly Profit</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => exportCSV("monthly-profit", data.monthlyProfit)}>
              <Download className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.monthlyProfit}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", color: "#fff" }}
                />
                <Bar dataKey="profit" fill="#ffffff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Most Active Users</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => exportCSV("active-users", data.mostActiveUsers)}>
              <Download className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.mostActiveUsers.length === 0 ? (
                <p className="text-gray-500">No data available</p>
              ) : (
                data.mostActiveUsers.map((user, i) => (
                  <div key={user.user_id} className="flex items-center justify-between py-2 border-b border-card-border">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-500">#{i + 1}</span>
                      <div>
                        <p className="font-medium text-white">{user.full_name}</p>
                        <p className="text-sm text-gray-400">{user.username}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-white">{user.project_count} projects</p>
                      <p className="text-sm text-gray-400">{formatCurrency(user.total_revenue)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Top Projects by Profit</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => exportCSV("top-projects-profit", data.topProjectsByProfit)}>
              <Download className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topProjectsByProfit.length === 0 ? (
                <p className="text-gray-500">No project data available</p>
              ) : (
                data.topProjectsByProfit.map((p, i) => (
                  <div key={p.project_number} className="flex items-center justify-between py-2 border-b border-card-border">
                    <div className="flex items-center gap-3">
                      <Trophy className={cn("h-4 w-4", i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-600" : "text-gray-500")} />
                      <div>
                        <Link href={`/projects`} className="font-medium text-white hover:text-gray-300">
                          {p.name}
                        </Link>
                        <p className="text-sm text-gray-400">{p.project_number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-400">{formatCurrency(p.net_profit)}</p>
                      <p className="text-xs text-gray-500">Rev: {formatCurrency(p.total_revenue)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", color: "#fff" }}
                />
                <Line type="monotone" dataKey="new_users" stroke="#ffffff" strokeWidth={2} />
                <Line type="monotone" dataKey="total_users" stroke="#6b7280" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Project Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.projectGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", color: "#fff" }}
                />
                <Bar dataKey="new_projects" fill="#ffffff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Highest Expenses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Projects with Highest Expenses</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => exportCSV("high-expenses", data.topProjectsByExpenses)}>
            <Download className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.topProjectsByExpenses.length === 0 ? (
              <p className="text-gray-500">No data available</p>
            ) : (
              data.topProjectsByExpenses.map((p) => (
                <div key={p.project_number} className="flex items-center justify-between py-2 border-b border-card-border">
                  <div>
                    <p className="font-medium text-white">{p.name}</p>
                    <p className="text-sm text-gray-400">{p.project_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-400 font-medium">{formatCurrency(p.total_expenses)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
