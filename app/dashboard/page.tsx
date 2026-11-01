/**
 * BEXA AI — Protected Dashboard (server-rendered with auth check)
 */

import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import DashboardContent from "./dashboard-content";

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function DashboardPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.status !== "active") {
    redirect("/login");
  }

  // Role check: ADMIN or OWNER
  if (profile.role !== "ADMIN" && profile.role !== "OWNER") {
    redirect("/unauthorized");
  }

  return <DashboardContent />;
}