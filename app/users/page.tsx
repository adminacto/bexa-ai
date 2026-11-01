"use client";
/**
 * BEXA AI — Users page
 * Lists all users with search, filter, sort.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import {
  Users,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

type User = {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  email: string;
  phone?: string | null;
  role: "OWNER" | "ADMIN" | "USER";
  status: "active" | "suspended" | "invited" | "banned";
  avatar_url?: string | null;
  created_at: string;
  last_login?: string | null;
  last_activity?: string | null;
  force_password_change: boolean;
  project_count?: number;
  total_revenue?: number;
  total_expenses?: number;
  net_profit?: number;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        search,
        status: statusFilter,
        sort: sortField,
        order: sortOrder,
      });

      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users");

      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, search, statusFilter, sortField, sortOrder]);

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update user");
      }

      toast.success(`User ${newStatus === "suspended" ? "suspended" : "activated"}`);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-800 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-800 rounded-xl" />
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
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-sm text-gray-400">
            {pagination.total} registered users
          </p>
        </div>
        <Button onClick={loadUsers} variant="ghost" size="sm">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by name, username, or ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="invited">Invited</option>
              <option value="banned">Banned</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Registered Users</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border text-left">
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase">
                      User
                    </th>
                    <th
                      className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase cursor-pointer hover:text-gray-300"
                      onClick={() => toggleSort("user_id")}
                    >
                      <div className="flex items-center gap-1">
                        ID
                        {sortField === "user_id" &&
                          (sortOrder === "asc" ? (
                            <SortAsc className="h-3 w-3" />
                          ) : (
                            <SortDesc className="h-3 w-3" />
                          ))}
                      </div>
                    </th>
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase">
                      Role
                    </th>
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase">
                      Status
                    </th>
                    <th
                      className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase cursor-pointer hover:text-gray-300"
                      onClick={() => toggleSort("project_count")}
                    >
                      <div className="flex items-center gap-1">
                        Projects
                        {sortField === "project_count" &&
                          (sortOrder === "asc" ? (
                            <SortAsc className="h-3 w-3" />
                          ) : (
                            <SortDesc className="h-3 w-3" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase cursor-pointer hover:text-gray-300"
                      onClick={() => toggleSort("total_revenue")}
                    >
                      <div className="flex items-center gap-1">
                        Revenue
                        {sortField === "total_revenue" &&
                          (sortOrder === "asc" ? (
                            <SortAsc className="h-3 w-3" />
                          ) : (
                            <SortDesc className="h-3 w-3" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase cursor-pointer hover:text-gray-300"
                      onClick={() => toggleSort("net_profit")}
                    >
                      <div className="flex items-center gap-1">
                        Net Profit
                      </div>
                    </th>
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase">
                      Last Login
                    </th>
                    <th className="py-3 text-right text-xs font-medium text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-card-border/50 hover:bg-card-hover/30 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.full_name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold text-gray-400">
                                {user.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/users/${user.id}`}
                              className="font-medium text-white hover:text-gray-300"
                            >
                              {user.full_name}
                            </Link>
                            <p className="text-sm text-gray-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-300">{user.user_id}</td>
                      <td className="py-3 pr-4">
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
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            "inline-flex px-2 py-1 text-xs rounded",
                            user.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : user.status === "suspended"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : user.status === "banned"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-gray-500/20 text-gray-400"
                          )}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-300">
                        {user.project_count || 0}
                      </td>
                      <td className="py-3 pr-4 text-gray-300">
                        {formatCurrency(user.total_revenue || 0)}
                      </td>
                      <td className="py-3 pr-4 text-gray-300">
                        {formatCurrency(user.net_profit || 0)}
                      </td>
                      <td className="py-3 pr-4 text-gray-400">
                        {formatDate(user.last_login)}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/users/${user.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {user.status === "active" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(user.id, "suspended")}
                              title="Suspend"
                            >
                              <PauseCircle className="h-4 w-4 text-yellow-400" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(user.id, "active")}
                              title="Activate"
                            >
                              <PlayCircle className="h-4 w-4 text-green-400" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-400">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
              }
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))
              }
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
