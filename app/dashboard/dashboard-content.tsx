"use client";

/**
 * BEXA AI — Dashboard client content
 * Fetches real data from the API and displays it.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Users,
  FolderOpen,
  DollarSign,
  TrendingUp,
  PackageCheck,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";

type DashboardStats = {
  totalUsers: number;
  totalProjects: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  activeProjects: number;
  completedProjects: number;
  recentUsers: Array<{
    id: string;
    user_id: string;
    full_name: string;
    username: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
  }>;
  recentProjects: Array<{
    id: string;
    project_number: string;
    name: string;
    description: string | null;
    owner_id: string;
    status: string;
    budget: number;
    total_revenue: number;
    total_expenses: number;
    start_date: string | null;
    deadline: string | null;
    created_at: string;
  }>;
  revenueByDay: Array<{ date: string; revenue: number; expenses: number }>;
};

export default function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>("all_time");

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]);

  async function loadStats() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("range", dateFilter);
      const res = await fetch(`/api/dashboard?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setStats(data);
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  const cards = [
    { label: "Total Users", value: stats?.totalUsers.toLocaleString() || "0", icon: Users, href: "/users" },
    { label: "Total Projects", value: stats?.totalProjects.toLocaleString() || "0", icon: FolderOpen, href: "/projects" },
    { label: "Total Revenue", value: formatCurrency(stats?.totalRevenue || 0), icon: DollarSign, href: "/payments" },
    { label: "Total Expenses", value: formatCurrency(stats?.totalExpenses || 0), icon: TrendingUp, href: "/payments" },
    { label: "Net Profit", value: formatCurrency(stats?.netProfit || 0), icon: TrendingUp, href: "/analytics" },
    { label: "Active Projects", value: stats?.activeProjects.toLocaleString() || "0", icon: Clock, href: "/projects" },
    { label: "Completed Projects", value: stats?.completedProjects.toLocaleString() || "0", icon: PackageCheck, href: "/projects" },
  ];

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-800 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400">BEXA AI Admin Management System</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
            <option value="all_time">All Time</option>
            <option value="today">Today</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="this_month">This Month</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="hover:border-gray-600 transition-all duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">{card.label}</p>
                    <p className="text-2xl font-bold text-white">{card.value}</p>
                  </div>
                  <div className="rounded-lg bg-gray-900 p-3">
                    <card.icon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats?.revenueByDay || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", color: "#fff" }}
                />
                <Bar dataKey="revenue" fill="#ffffff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#6b7280" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Recent Users
                </h4>
                {(!stats?.recentUsers || stats.recentUsers.length === 0) ? (
                  <p className="text-sm text-gray-500">No users yet</p>
                ) : (
                  <div className="space-y-2">
                    {stats.recentUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between py-2 border-b border-card-border">
                        <div>
                          <p className="font-medium text-white">{u.full_name}</p>
                          <p className="text-sm text-gray-400">{u.username} • {u.email}</p>
                        </div>
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded",
                            u.role === "OWNER"
                              ? "bg-purple-500/20 text-purple-400"
                              : u.role === "ADMIN"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-gray-500/20 text-gray-400"
                          )}
                        >
                          {u.role}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Recent Projects
                </h4>
                {(!stats?.recentProjects || stats.recentProjects.length === 0) ? (
                  <p className="text-sm text-gray-500">No projects yet</p>
                ) : (
                  <div className="space-y-2">
                    {stats.recentProjects.map((p) => (
                      <Link
                        key={p.id}
                        href={`/projects/${p.id}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between py-2 border-b border-card-border hover:bg-card-hover rounded transition-colors">
                          <div>
                            <p className="font-medium text-white">{p.name}</p>
                            <p className="text-sm text-gray-400">
                              {p.project_number} • {p.description?.slice(0, 50) || "No description"}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "text-xs px-2 py-1 rounded",
                              p.status === "completed"
                                ? "bg-green-500/20 text-green-400"
                                : p.status === "active"
                                ? "bg-blue-500/20 text-blue-400"
                                : p.status === "paused"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                            )}
                          >
                            {p.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}