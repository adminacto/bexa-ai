"use client";
/**
 * BEXA AI — Projects page
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import {
  FolderOpen,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  Pause,
  PauseCircle,
  PlayCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

type Project = {
  id: string;
  project_number: string;
  name: string;
  description?: string | null;
  owner_id: string;
  owner_name?: string;
  status: "active" | "completed" | "paused" | "cancelled";
  start_date?: string | null;
  deadline?: string | null;
  budget: number;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  created_at: string;
  updated_at: string;
  member_count: number;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const statusConfig = {
  active: { label: "Active", color: "bg-blue-500/20 text-blue-400", icon: FolderOpen },
  completed: { label: "Completed", color: "bg-green-500/20 text-green-400", icon: CheckCircle },
  paused: { label: "Paused", color: "bg-yellow-500/20 text-yellow-400", icon: PauseCircle },
  cancelled: { label: "Cancelled", color: "bg-red-500/20 text-red-400", icon: XCircle },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const loadProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        search,
        status: statusFilter,
      });

      const res = await fetch(`/api/projects?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load projects");

      setProjects(data.projects);
      setPagination(data.pagination);
    } catch (err) {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [pagination.page, search, statusFilter]);

  const generateProjectNumber = () => {
    // Client-side estimate; server assigns the real one
    return "PRJ-" + (1000 + Math.floor(Math.random() * 9000));
  };

  if (loading && projects.length === 0) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-800 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-800 rounded-xl" />
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
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-gray-400">
            {pagination.total} projects total
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by name, number, or description..."
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
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No projects found</p>
              <Link href="/projects/new" className="inline-block mt-2 text-white hover:text-gray-300 underline text-sm">
                Create first project
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border text-left">
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase">Project</th>
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase">Owner</th>
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase">Status</th>
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase">Start</th>
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase">Deadline</th>
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase text-right">Revenue</th>
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase text-right">Expenses</th>
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase text-right">Profit</th>
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase">Members</th>
                    <th className="py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr
                      key={project.id}
                      className="border-b border-card-border/50 hover:bg-card-hover/30 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <Link
                          href={`/projects/${project.id}`}
                          className="font-medium text-white hover:text-gray-300"
                        >
                          {project.name}
                        </Link>
                        <p className="text-sm text-gray-400">{project.project_number}</p>
                      </td>
                      <td className="py-3 pr-4 text-gray-300">{project.owner_name || "—"}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 text-xs rounded",
                            statusConfig[project.status]?.color
                          )}
                        >
                          {statusConfig[project.status]?.icon && (() => {
                            const Icon = statusConfig[project.status].icon;
                            return <Icon className="h-3 w-3" />;
                          })()}
                          {statusConfig[project.status]?.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-300">{formatDate(project.start_date)}</td>
                      <td className="py-3 pr-4 text-gray-300">{formatDate(project.deadline)}</td>
                      <td className="py-3 pr-4 text-right text-green-400">{formatCurrency(project.total_revenue)}</td>
                      <td className="py-3 pr-4 text-right text-red-400">{formatCurrency(project.total_expenses)}</td>
                      <td className="py-3 pr-4 text-right">
                        <span
                          className={cn(
                            "font-medium",
                            project.net_profit >= 0 ? "text-white" : "text-red-400"
                          )}
                        >
                          {formatCurrency(project.net_profit)}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-300">{project.member_count}</td>
                      <td className="py-3 text-right">
                        <Link href={`/projects/${project.id}`}>
                          <Button variant="ghost" size="sm">
                            View
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
