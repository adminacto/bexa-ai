// BEXA AI — Next.js middleware
// Protects private routes and enforces role-based access control.
// Uses the Supabase SSR pattern: reads/writes cookies via request/response.
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
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

  // Supabase SSR pattern for middleware: cookie access via request/response
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get authenticated user (also refreshes tokens if needed)
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

  // Forward the (possibly refreshed) auth cookies to the response
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
