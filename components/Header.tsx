"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Menu, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { profile } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-card-border bg-surface/80 backdrop-blur-sm px-4 lg:px-6">
      {/* Left: Mobile menu button + page title area */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <span className="text-xl font-bold text-primary">BEXA AI</span>
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <User className="h-5 w-5" />
            )}
          </Button>
        </Link>
      </div>
    </header>
  );
}
