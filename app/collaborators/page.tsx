"use client";
/**
 * BEXA AI — Collaborators page
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
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

type Collaborator = {
  id: string;
  project_id: string;
  user_id: string;
  role: "owner" | "manager" | "developer" | "designer" | "analyst" | "contributor";
  responsibilities?: string | null;
  start_date: string;
  revenue_share?: number | null;
  created_at: string;
  user: {
    full_name: string;
    username: string;
    email: string;
    role: string;
    status: string;
  };
  project: {
    project_number: string;
    name: string;
    total_revenue: number;
    total_expenses: number;
  };
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function CollaboratorsPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const loadCollaborators = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        search,
        project: projectFilter,
      });

      const res = await fetch(`/api/collaborators?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");

      setCollaborators(data.collaborators);
      setPagination(data.pagination);
    } catch (err) {
      toast.error("Failed to load collaborators");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollaborators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, search, projectFilter]);

  if (loading && collaborators.length === 0) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-800 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
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
          <h1 className="text-2xl font-bold text-white">Collaborators</h1>
          <p className="text-sm text-gray-400">
            {pagination.total} collaboration records
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by user or project..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Collaborators table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Collaboration Records</CardTitle>
        </CardHeader>
        <CardContent>
          {collaborators.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No collaborators found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border text-left">
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase">User</th>
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase">Project</th>
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase">Role</th>
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase">Start Date</th>
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase text-right">Revenue Share</th>
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase">Responsibilities</th>
                    <th className="py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {collaborators.map((c) => (
                    <tr key={c.id} className="border-b border-card-border/50 hover:bg-card-hover/30 transition-colors">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/users/${c.user_id}`}
                          className="font-medium text-white hover:text-gray-300"
                        >
                          {c.user?.full_name || "—"}
                        </Link>
                        <p className="text-sm text-gray-400">{c.user?.email}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <Link
                          href={`/projects/${c.project_id}`}
                          className="text-white hover:text-gray-300"
                        >
                          {c.project?.name}
                        </Link>
                        <p className="text-sm text-gray-400">{c.project?.project_number}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            "inline-flex px-2 py-1 text-xs rounded",
                            c.role === "owner"
                              ? "bg-purple-500/20 text-purple-400"
                              : c.role === "manager"
                              ? "bg-blue-500/20 text-blue-400"
                              : c.role === "developer"
                              ? "bg-green-500/20 text-green-400"
                              : c.role === "designer"
                              ? "bg-pink-500/20 text-pink-400"
                              : c.role === "analyst"
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-gray-500/20 text-gray-400"
                          )}
                        >
                          {c.role}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-300">{formatDate(c.start_date)}</td>
                      <td className="py-3 pr-4 text-right text-gray-300">
                        {c.revenue_share ? `${c.revenue_share}%` : "—"}
                      </td>
                      <td className="py-3 pr-4 text-gray-300">
                        {c.responsibilities
                          ? c.responsibilities.length > 50
                            ? `${c.responsibilities.slice(0, 50)}…`
                            : c.responsibilities
                          : "—"}
                      </td>
                      <td className="py-3 text-right">
                        <Link href={`/projects/${c.project_id}`}>
                          <Button variant="ghost" size="sm">
                            View Project
                          </Button>
                        </Link>
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
              onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
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
