import { createBrowserClient } from "@supabase/ssr";

export const createClient = (
  supabase = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  }
) =>
  createBrowserClient(supabase.url, supabase.key, {
    cookieOptions: {
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  });
