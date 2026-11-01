/**
 * BEXA AI — Auth helpers for API routes
 * Protects routes and enforces role-based access control.
 * Uses Supabase Auth sessions (JWT-based).
 */

import { NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Role requirements per route prefix
export const ROUTE_ROLES: Record<string, "OWNER" | "ADMIN"> = {
  "/users": "ADMIN",
  "/projects": "ADMIN",
  "/payments": "ADMIN",
  "/collaborators": "ADMIN",
  "/analytics": "ADMIN",
  "/settings": "ADMIN",
};

// Service role client for bypassing RLS (server-side only)
const supabaseAdmin = createAdminClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function requireAuth(
  request: NextRequest,
  requiredRole?: "OWNER" | "ADMIN" | "USER"
) {
  const cookieStore = await createSupabaseClient();

  // Get the authenticated user
  const {
    data: { user },
    error,
  } = await cookieStore.auth.getUser();

  if (!user) {
    return { user: null, profile: null, error: "Not authenticated", supabase: supabaseAdmin };
  }

  // Fetch the user's profile via service role (contains role + status)
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profileError) {
    return { user, profile: null, error: "Profile not found", supabase: supabaseAdmin };
  }

  // Check account status
  if ((profile as any).status !== "active") {
    return { user, profile, error: "Account is not active", supabase: supabaseAdmin };
  }

  // Role-based access control
  if (requiredRole) {
    const roleHierarchy = { USER: 0, ADMIN: 1, OWNER: 2 };
    const userLevel = roleHierarchy[(profile as any).role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
      return {
        user,
        profile,
        error: "Insufficient permissions",
        accessDenied: true,
        supabase: supabaseAdmin,
      };
    }
  }

  return { user, profile, supabase: supabaseAdmin, error: null };
}

export function getRouteRole(pathname: string): "OWNER" | "ADMIN" | undefined {
  for (const [prefix, role] of Object.entries(ROUTE_ROLES)) {
    if (pathname.startsWith(prefix)) return role;
  }
  return undefined;
}