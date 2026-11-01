/**
 * BEXA AI — Auth Context
 * Provides client-side auth state (user, profile, loading) and auth actions.
 */

"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Profile = {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  email: string;
  role: "OWNER" | "ADMIN" | "USER";
  status: "active" | "suspended" | "invited" | "banned";
  avatar_url?: string | null;
  created_at: string;
  force_password_change: boolean;
};

type AuthContextType = {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  supabase: typeof supabase;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  supabase,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        setUser(null);
        setProfile(null);
        return;
      }
      const data = await res.json();
      if (data?.user) {
        const u = data.user;
        setUser(u);
        setProfile(u as Profile);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch {
      setUser(null);
      setProfile(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchProfile();
      setLoading(false);
    };
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      await fetchProfile();
    });
    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, supabase, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export { supabase };