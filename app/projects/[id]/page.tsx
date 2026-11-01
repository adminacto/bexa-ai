"use client";

/**
 * BEXA AI — Project Detail page
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import {
  FolderOpen,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

type ProjectDetail = {
  project: {
    id: string;
    project_number: string;
    name: string;
    description?: string | null;
    owner_id: string;
    status: "active" | "completed" | "paused" | "cancelled";
    start_date?: string | null;
    deadline?: string | null;
    budget: number;
    total_revenue: number;
    total_expenses: number;
    created_at: string;
    updated_at: string;
    owner: { id: string; full_name: string; username: string; email: string; role: string; status: string; avatar_url?: string | null };
  };
  members: Array<{
    id: string;
    project_id: string;
    user_id: string;
    role: string;
    responsibilities?: string | null;
    start_date: string;
    revenue_share?: number | null;
    created_at: string;
    user: { id: string; full_name: string; username: string; email: string; role: string; status: string; avatar_url?: string | null };
  }>;
  transactions: any[];
  activity: any;
  financial_summary: {
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
    budget: number;
    budget_utilization: number;
  };
};

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-blue-500/20 text-blue-400" },
  completed: { label: "Completed", color: "bg-green-500/20 text-green-400" },
  paused: { label: "Paused", color: "bg-yellow-500/20 text-yellow-400" },
  cancelled: { label: "Cancelled", color: "bg-red-500/20 text-red-400" },
};

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [selectedTab, setSelectedTab] = useState<"overview" | "members" | "transactions" | "activity">("overview");

  const [projectId, setProjectId] = useState<string>("");
  useEffect(() => {
    (params as any).then((p: any) => setProjectId(p.id));
  }, [params]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load project");
      setProject(data);
      setEditForm({
        name: data.project.name,
        description: data.project.description || "",
        owner_id: data.project.owner_id,
        status: data.project.status,
        start_date: data.project.start_date || "",
        deadline: data.project.deadline || "",
        budget: data.project.budget,
      });
    } catch (err) {
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) loadProject();
  }, [projectId]);

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Project updated");
      setEditing(false);
      loadProject();
    } catch (err) {
      toast.error("Failed to save project");
    }
  };

  if (loading || !project) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/4" />
          <div className="h-64 bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const p = project.project;
  const fin = project.financial_summary;
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "members", label: "Members" },
    { id: "transactions", label: "Transactions" },
    { id: "activity", label: "Activity" },
  ];

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/projects" className="text-gray-400 hover:text-white">
            ← Back to Projects
          </Link>
          <h1 className="text-2xl font-bold text-white">{p.name}</h1>
          <span className="text-gray-500">{p.project_number}</span>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Project Header Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Project Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <div className="space-y-3">
                <Input
                  placeholder="Project Name"
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
                <Textarea
                  placeholder="Description"
                  value={editForm.description || ""}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
                <Select
                  value={editForm.status || "active"}
                  onChange={(val) => setEditForm({ ...editForm, status: val })}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
                <Input
                  type="date"
                  value={editForm.start_date?.slice(0, 10) || ""}
                  onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                />
                <Input
                  type="date"
                  value={editForm.deadline?.slice(0, 10) || ""}
                  onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Budget"
                  value={editForm.budget || 0}
                  onChange={(e) => setEditForm({ ...editForm, budget: parseFloat(e.target.value) })}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500">Project Number</label>
                  <p className="text-white font-mono">{p.project_number}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Description</label>
                  <p className="text-gray-300">{p.description || "No description"}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Status</label>
                  <span
                    className={cn(
                      "inline-flex px-2 py-1 text-xs rounded",
                      statusConfig[p.status]?.color
                    )}
                  >
                    {statusConfig[p.status]?.label}
                  </span>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Start Date</label>
                  <p className="text-white">{formatDate(p.start_date)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Deadline</label>
                  <p className="text-white">{formatDate(p.deadline)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Budget</label>
                  <p className="text-white">{formatCurrency(p.budget)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-gray-500">Total Revenue</label>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(fin.total_revenue)}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Total Expenses</label>
              <p className="text-2xl font-bold text-red-400">{formatCurrency(fin.total_expenses)}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Net Profit</label>
              <p
                className={cn(
                  "text-2xl font-bold",
                  fin.net_profit >= 0 ? "text-white" : "text-red-400"
                )}
              >
                {formatCurrency(fin.net_profit)}
              </p>
            </div>
            {p.budget > 0 && (
              <div>
                <label className="text-xs text-gray-500">
                  Budget Utilization ({fin.budget_utilization.toFixed(1)}%)
                </label>
                <div className="w-full bg-gray-800 rounded-full h-2 mt-1">
                  <div
                    className="bg-white h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, fin.budget_utilization)}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Owner */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Project Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                {p.owner?.avatar_url ? (
                  <img src={p.owner.avatar_url} alt={p.owner.full_name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-gray-400">
                    {p.owner?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "—"}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium text-white">{p.owner?.full_name || "—"}</p>
                <p className="text-sm text-gray-400">{p.owner?.username || "—"}</p>
                <p className="text-xs text-gray-400">{p.owner?.email || "—"}</p>
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs text-gray-500">Created</label>
              <p className="text-white text-sm">{formatDate(p.created_at)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Details</CardTitle>
          <div className="flex gap-1 mt-2 border-b border-card-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors",
                  selectedTab === tab.id
                    ? "text-white border-b-2 border-white"
                    : "text-gray-400 hover:text-gray-300"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {selectedTab === "members" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-400 uppercase">
                  Project Members ({project.members.length})
                </h3>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </div>
              {project.members.length === 0 ? (
                <p className="text-gray-500">No members yet</p>
              ) : (
                <div className="space-y-2">
                  {project.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 border border-card-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-400">
                            {m.user?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "—"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{m.user?.full_name || "—"}</p>
                          <p className="text-sm text-gray-400">{m.user?.email || "—"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-300">{m.role}</span>
                        {m.revenue_share && (
                          <p className="text-xs text-gray-500">{m.revenue_share}% share</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTab === "transactions" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase">
                Project Transactions ({project.transactions.length})
              </h3>
              {project.transactions.length === 0 ? (
                <p className="text-gray-500">No transactions for this project</p>
              ) : (
                <div className="space-y-2">
                  {project.transactions.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-3 border border-card-border rounded-lg">
                      <div>
                        <p className="font-medium text-white">{t.transaction_number}</p>
                        <p className="text-sm text-gray-400">{t.description || t.type}</p>
                        <p className="text-xs text-gray-500">{formatDate(t.date)}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            "font-medium",
                            t.type === "revenue" ? "text-green-400" :
                            t.type === "expense" ? "text-red-400" :
                            "text-gray-400"
                          )}
                        >
                          {t.type === "expense" ? "-" : t.type === "refund" ? "-" : "+"}{formatCurrency(t.amount)}
                        </p>
                        <span className="text-xs text-gray-400">{t.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTab === "activity" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase">
                Activity Timeline ({project.activity.length})
              </h3>
              {project.activity.length === 0 ? (
                <p className="text-gray-500">No activity recorded</p>
              ) : (
                <div className="space-y-3">
                  {project.activity.map((a: any) => (
                    <div key={a.id} className="flex gap-3 p-3 border-l border-card-border">
                      <div className="w-2 h-2 rounded-full bg-white mt-1" />
                      <div className="flex-1">
                        <p className="text-white">{a.action}</p>
                        {a.details && (
                          <p className="text-xs text-gray-500">{JSON.stringify(a.details)}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {formatDate(a.created_at)} · by {a.actor?.full_name || "System"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTab === "overview" && (
            <div className="space-y-4">
              <p className="text-gray-400">Use the tabs above for detailed information.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
