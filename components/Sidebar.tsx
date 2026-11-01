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
  X,
} from "lucide-react";

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

export function Sidebar({
  open,
  onClose,
  className,
}: {
  open?: boolean;
  onClose?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();

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
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile sidebar drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col bg-surface border-r border-card-border pt-16">
          <div className="flex justify-end p-2 border-b border-card-border">
            <button onClick={onClose} className="p-1 text-muted-foreground hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {visibleItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
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
                onClose?.();
                handleLogout();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar — in-flow so it pushes content */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:border-r lg:border-card-border lg:bg-surface lg:overflow-y-auto",
          className
        )}
      >
        <div className="flex flex-col h-full pt-6">
          <nav className="flex-1 space-y-1 px-3">
            {visibleItems.map((item) => (
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
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
