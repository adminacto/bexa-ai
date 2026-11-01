"use client";
/**
 * BEXA AI — Payments & Transactions page
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import {
  CreditCard,
  Search,
  Download,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

type Transaction = {
  id: string;
  transaction_number: string;
  type: "revenue" | "expense" | "refund" | "transfer";
  amount: number;
  currency: string;
  date: string;
  user_id?: string | null;
  user_name?: string;
  project_id?: string | null;
  project_number?: string;
  payment_method?: string | null;
  status: "completed" | "pending" | "failed" | "cancelled";
  description?: string | null;
  authorized_creator?: string | null;
  created_at: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Summary stats
  const [summary, setSummary] = useState<{
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
  }>({ totalRevenue: 0, totalExpenses: 0, netProfit: 0 });

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        search,
        type: typeFilter,
        status: statusFilter,
      });

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load transactions");

      setTransactions(data.transactions);
      setPagination(data.pagination);
      setSummary(data.summary);
    } catch (err) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, search, typeFilter, statusFilter]);

  const exportCSV = () => {
    const headers = ["ID", "Type", "Amount", "Currency", "Date", "Status", "Description", "User", "Project"];
    const rows = transactions.map((t) => [
      t.transaction_number,
      t.type,
      t.amount,
      t.currency,
      t.date,
      t.status,
      `"${(t.description || "").replace(/"/g, '""')}"`,
      `"${(t.user_name || "").replace(/"/g, '""')}"`,
      t.project_number || "",
    ]);

    const csvContent =
      [headers.join(",")]
        .concat(rows.map((r) => r.join(",")))
        .join("\n") + "\n";

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="p-6 space-y-4">
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
          <h1 className="text-2xl font-bold text-white">Payments & Transactions</h1>
          <p className="text-sm text-gray-400">{pagination.total} transactions</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(summary.totalRevenue)}
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
                  {formatCurrency(summary.totalExpenses)}
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
                <p className="text-sm text-gray-400">Net Profit</p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    summary.netProfit >= 0 ? "text-white" : "text-red-400"
                  )}
                >
                  {formatCurrency(summary.netProfit)}
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
              <option value="refund">Refund</option>
              <option value="transfer">Transfer</option>
            </Select>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
            <Button variant="ghost" size="sm" onClick={loadTransactions}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border text-left">
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase">ID</th>
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase">Type</th>
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase text-right">Amount</th>
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase">Date</th>
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase">User</th>
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase">Project</th>
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase">Method</th>
                    <th className="py-3 pr-4 text-xs font-medium text-gray-400 uppercase">Status</th>
                    <th className="py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-card-border/50 hover:bg-card-hover/30 transition-colors">
                      <td className="py-3 pr-4 text-gray-300 font-mono text-xs">{t.transaction_number}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            "inline-flex px-2 py-1 text-xs rounded",
                            t.type === "revenue"
                              ? "bg-green-500/20 text-green-400"
                              : t.type === "expense"
                              ? "bg-red-500/20 text-red-400"
                              : t.type === "refund"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-blue-500/20 text-blue-400"
                          )}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <span
                          className={cn(
                            "font-medium",
                            t.type === "revenue" ? "text-green-400" :
                            t.type === "expense" ? "text-red-400" :
                            "text-gray-300"
                          )}
                        >
                          {t.type === "expense" || t.type === "refund" ? "-" : "+"}{formatCurrency(t.amount, t.currency)}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-300">{formatDate(t.date)}</td>
                      <td className="py-3 pr-4 text-gray-300">{t.user_name || "—"}</td>
                      <td className="py-3 pr-4 text-gray-300">{t.project_number || "—"}</td>
                      <td className="py-3 pr-4 text-gray-300">{t.payment_method || "—"}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            "inline-flex px-2 py-1 text-xs rounded",
                            t.status === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : t.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          )}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
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
