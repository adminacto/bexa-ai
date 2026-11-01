"use client";
/**
 * BEXA AI — New Project form
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

export default function NewProjectPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [status, setStatus] = useState("active");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Array<{ id: string; full_name: string; username: string }>>([]);

  const supabase = createClient();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, username")
      .in("role", ["OWNER", "ADMIN"]);

    if (error) {
      toast.error("Failed to load users");
      return;
    }
    setMembers(data || []);
    if (data && data.length > 0 && !ownerId) {
      setOwnerId(data[0].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          owner_id: ownerId,
          status,
          start_date: startDate || null,
          deadline: deadline || null,
          budget: parseFloat(budget) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create project");

      toast.success("Project created successfully");
      window.location.href = `/projects/${data.project.id}`;
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/projects" className="text-gray-400 hover:text-white">
          ← Back to Projects
        </Link>
        <h1 className="text-2xl font-bold text-white">New Project</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Project Name *
              </label>
              <Input
                placeholder="Enter project name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <Textarea
                placeholder="Describe the project..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Project Owner *
              </label>
              <Select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} required>
                <option value="">Select owner</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.username})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Status
              </label>
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Schedule & Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Deadline
              </label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Budget
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                step="0.01"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/projects">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create Project"}
          </Button>
        </div>
      </form>
    </div>
  );
}
