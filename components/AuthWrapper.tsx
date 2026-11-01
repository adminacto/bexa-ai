/**
 * BEXA AI — Root layout wrapper that wraps the app with auth context.
 * Individual pages use `auth()` to protect routes.
 */

import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";

export function AuthWrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
