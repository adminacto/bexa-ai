"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  CreditCard,
  UsersIcon,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  ownerOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/users", icon: Users, adminOnly: true },
  { label: "Projects", href: "/projects", icon: FolderOpen, adminOnly: true },
  { label: "Payments", href: "/payments", icon: CreditCard, adminOnly: true },
  { label: "Collaborators", href: "/collaborators", icon: UsersIcon, adminOnly: true },
  { label: "Analytics", href: "/analytics", icon: BarChart3, adminOnly: true },
  { label: "Settings", href: "/settings", icon: Settings, adminOnly: true },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const canAccess = (item: NavItem) => {
    if (!item.adminOnly && !item.ownerOnly) return true;
    if (!profile) return false;
    if (profile.role === "OWNER") return true;
    if (item.adminOnly && profile.role === "ADMIN") return true;
    return false;
  };

  const visibleItems = navItems.filter(canAccess);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <MobileSidebarContent
          items={visibleItems}
          pathname={pathname}
          onNavigate={() => setMobileOpen(false)}
          onLogout={handleLogout}
        />
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-card-border lg:bg-surface lg:overflow-y-auto lg:fixed lg:inset-y-0 lg:top-16 lg:z-30",
          className
        )}
      >
        <SidebarContent
          items={visibleItems}
          pathname={pathname}
          onLogout={handleLogout}
        />
      </aside>
    </>
  );
}

function SidebarContent({
  items,
  pathname,
  onLogout,
}: {
  items: NavItem[];
  pathname: string;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-col h-full pt-6">
      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all hover:bg-card-hover",
              pathname === item.href
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-card-border">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );
}

function MobileSidebarContent({
  items,
  pathname,
  onNavigate,
  onLogout,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-surface border-r border-card-border pt-16">
      <div className="flex justify-end p-2 border-b border-card-border">
        <X className="h-5 w-5 cursor-pointer text-muted-foreground" onClick={() => {}} />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all hover:bg-card-hover",
              pathname === item.href
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-card-border">
        <button
          onClick={() => {
            onNavigate();
            onLogout();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );
}
