"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import type { ReactNode } from "react";

const AUTH_PAGES = ["/login", "/change-password", "/unauthorized"];

export function LayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}