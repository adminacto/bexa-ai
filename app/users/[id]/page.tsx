"use client";
/**
 * BEXA AI — User Detail Page
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Edit,
  Save,
  X,
  Trash2,
  Users,
  Activity,
  DollarSign,
  Pause,
  Play,
} from "lucide-react";
import { toast } from "sonner";

type UserDetail = {
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
  owned_projects: any[];
  member_projects: any[];
  collaborators: any[];
  transactions: any[];
  activity: any[];
  financial_summary: {
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
  };
};

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  const [userId, setUserId] = useState<string>("");
  useEffect(() => {
    (params as any).then((p: any) => setUserId(p.id));
  }, [params]);

  const loadUser = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load user");
      setUser(data);
      setEditForm({
        full_name: data.user.full_name,
        username: data.user.username,
        email: data.user.email,
        phone: data.user.phone || "",
      });
    } catch (err) {
      toast.error("Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadUser();
  }, [userId]);

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast.success("User updated");
      setEditing(false);
      loadUser();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleStatusToggle = async () => {
    if (!user) return;
    const newStatus = user.status === "active" ? "suspended" : "active";
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success(`User ${newStatus === "active" ? "activated" : "suspended"}`);
      loadUser();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  if (loading || !user) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/4" />
          <div className="h-64 bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/users" className="text-gray-400 hover:text-white">
            ← Back to Users
          </Link>
          <h1 className="text-2xl font-bold text-white">{user.full_name}</h1>
        </div>
        {user.status !== "banned" && (
          <div className="flex items-center gap-2">
            <Button
              variant={editing ? "outline" : "ghost"}
              size="sm"
              onClick={() => setEditing(!editing)}
            >
              {editing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              {editing ? "Cancel" : "Edit"}
            </Button>
            {editing && (
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleStatusToggle}
            >
              {user.status === "active" ? (
                <Pause className="h-4 w-4 text-yellow-400" />
              ) : (
                <Play className="h-4 w-4 text-green-400" />
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-400">
                    {user.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {editing ? (
              <div className="space-y-3">
                <Input
                  placeholder="Full Name"
                  value={editForm.full_name || ""}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                />
                <Input
                  placeholder="Username"
                  value={editForm.username || ""}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                />
                <Input
                  placeholder="Email"
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
                <Input
                  placeholder="Phone"
                  value={editForm.phone || ""}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500">Full Name</label>
                  <p className="text-white">{user.full_name}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Username</label>
                  <p className="text-white">{user.username}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Email</label>
                  <p className="text-white">{user.email}</p>
                </div>
                {user.phone && (
                  <div>
                    <label className="text-xs text-gray-500">Phone</label>
                    <p className="text-white">{user.phone}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-500">Role</label>
                  <span
                    className={cn(
                      "inline-flex px-2 py-1 text-xs rounded",
                      user.role === "OWNER"
                        ? "bg-purple-500/20 text-purple-400"
                        : user.role === "ADMIN"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-gray-500/20 text-gray-400"
                    )}
                  >
                    {user.role}
                  </span>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Status</label>
                  <span
                    className={cn(
                      "inline-flex px-2 py-1 text-xs rounded",
                      user.status === "active"
                        ? "bg-green-500/20 text-green-400"
                        : user.status === "suspended"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    )}
                  >
                    {user.status}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-gray-500">User ID</label>
              <p className="text-white font-mono">{user.user_id}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Projects</label>
              <p className="text-white">
                {user.owned_projects.length} owned,{" "}
                {user.member_projects.length} member
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Total Revenue</label>
              <p className="text-xl font-bold text-green-400">
                {formatCurrency(user.financial_summary.total_revenue)}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Total Expenses</label>
              <p className="text-xl font-bold text-red-400">
                {formatCurrency(user.financial_summary.total_expenses)}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Net Profit</label>
              <p className="text-xl font-bold text-white">
                {formatCurrency(user.financial_summary.net_profit)}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Registered</label>
              <p className="text-white">{formatDate(user.created_at)}</p>
            </div>
            {user.last_login && (
              <div>
                <label className="text-xs text-gray-500">Last Login</label>
                <p className="text-white">{formatDate(user.last_login)}</p>
              </div>
            )}
            {user.last_activity && (
              <div>
                <label className="text-xs text-gray-500">Last Activity</label>
                <p className="text-white">{formatDate(user.last_activity)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Projects and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase">
                Owned Projects
              </h4>
              {user.owned_projects.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">No owned projects</p>
              ) : (
                <div className="space-y-2">
                  {user.owned_projects.map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="block p-2 rounded-lg border border-card-border hover:bg-card-hover transition-colors"
                    >
                      <p className="font-medium text-white">{p.name}</p>
                      <p className="text-sm text-gray-400">{p.project_number}</p>
                      <div className="flex gap-4 mt-1 text-xs">
                        <span className="text-gray-400">
                          Rev: {formatCurrency(p.total_revenue)}
                        </span>
                        <span className="text-gray-400">
                          Exp: {formatCurrency(p.total_expenses)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <h4 className="text-xs font-semibold text-gray-500 uppercase mt-4">
                As Collaborator
              </h4>
              {user.member_projects.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">No collaboration projects</p>
              ) : (
                <div className="space-y-2">
                  {user.member_projects.map((p) => (
                    <Link
                      key={`${p.project_id}`}
                      href={`/projects/${p.id}`}
                      className="block p-2 rounded-lg border border-card-border hover:bg-card-hover transition-colors"
                    >
                      <p className="font-medium text-white">{p.name}</p>
                      <p className="text-sm text-gray-400">
                        {p.project_number} · Role: {p.member_role}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Activity History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase">
                Collaborators
              </h4>
              {user.collaborators.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">No collaborators</p>
              ) : (
                <div className="space-y-2">
                  {user.collaborators.slice(0, 5).map((c, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-card-border">
                      <div>
                        <p className="font-medium text-white">{c.full_name}</p>
                        <p className="text-xs text-gray-400">{c.role}</p>
                      </div>
                      <span className="text-xs text-gray-400">{c.project}</span>
                    </div>
                  ))}
                </div>
              )}

              <h4 className="text-xs font-semibold text-gray-500 uppercase mt-4">
                Transactions
              </h4>
              {user.transactions.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">No transactions</p>
              ) : (
                <div className="space-y-2">
                  {user.transactions.slice(0, 10).map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-2 border-b border-card-border">
                      <div>
                        <p className="font-medium text-white">{t.transaction_number}</p>
                        <p className="text-xs text-gray-400">{t.description || t.type}</p>
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
                          {formatCurrency(t.amount)}
                        </p>
                        <span
                          className={cn(
                            "text-xs px-1 py-0.5 rounded",
                            t.status === "completed" ? "bg-green-500/20 text-green-400" :
                            t.status === "failed" ? "bg-red-500/20 text-red-400" :
                            "bg-gray-500/20 text-gray-400"
                          )}
                        >
                          {t.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <h4 className="text-xs font-semibold text-gray-500 uppercase mt-4">
                Recent Activity
              </h4>
              {user.activity.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">No activity yet</p>
              ) : (
                <div className="space-y-2">
                  {user.activity.slice(0, 10).map((a) => (
                    <div key={a.id} className="py-2 border-b border-card-border last:border-0">
                      <p className="text-sm text-white">{a.action}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(a.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}