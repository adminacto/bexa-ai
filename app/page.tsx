/**
 * BEXA AI — Root page
 * Redirects to dashboard or login
 */

import { createClient as createServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  redirect("/login");
}