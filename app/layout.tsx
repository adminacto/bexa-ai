/**
 * BEXA AI — App Layout
 * Shows sidebar + header for protected routes, plain for auth pages.
 */

import "./globals.css";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { LayoutClient } from "@/components/layout-client";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "BEXA AI — Admin Management System",
  description: "BEXA AI Administration Panel",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              classNames: {
                error: "bg-red-500/10 border-red-500/30 text-red-300",
                success: "bg-green-500/10 border-green-500/30 text-green-300",
                warning: "bg-amber-500/10 border-amber-500/30 text-amber-300",
                info: "bg-blue-500/10 border-blue-500/30 text-blue-300",
              },
            }}
          />
          <LayoutClient>{children}</LayoutClient>
        </AuthProvider>
      </body>
    </html>
  );
}