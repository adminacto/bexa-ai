"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, User } from "lucide-react";
import { toast } from "sonner";

export function LoginForm() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!login || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Invalid login or password");
        return;
      }

      const user = data.user;
      if (!user) {
        toast.error("Login failed");
        return;
      }

      if (user.force_password_change) {
        router.push("/change-password");
        return;
      }

      toast.success("Welcome to BEXA AI");
      router.push("/dashboard");
    } catch (err) {
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          Login (username or email)
        </label>
        <div className="relative">
          <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="owner"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}