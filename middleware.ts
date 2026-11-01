// BEXA AI — Next.js middleware
// Protects private routes and enforces role-based access control.
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const PUBLIC_ROUTES = ["/login", "/unauthorized", "/api/", "/_next", "/favicon.ico", "/change-password"];

const ROUTE_ROLES: Record<string, "OWNER" | "ADMIN"> = {
  "/users": "ADMIN",
  "/projects": "ADMIN",
  "/payments": "ADMIN",
  "/collaborators": "ADMIN",
  "/analytics": "ADMIN",
  "/settings": "ADMIN",
};

const roleHierarchy: Record<string, number> = {
  USER: 0,
  ADMIN: 1,
  OWNER: 2,
};

const supabaseAdmin = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes and static assets
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const supabase = await createServerClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes — redirect to login if no session
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Get user profile via service role (bypasses RLS)
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (!profile || (profile as any).status !== "active") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Check role-based access
  const requiredRole = Object.entries(ROUTE_ROLES).find(([prefix]) =>
    pathname.startsWith(prefix)
  )?.[1];

  if (requiredRole) {
    const userLevel = roleHierarchy[(profile as any).role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
      const url = request.nextUrl.clone();
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};