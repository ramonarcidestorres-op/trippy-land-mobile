import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AuthUser = User & {
  role?: string;
};

type AuthValue = {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthValue>({ user: null, session: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUserRole(userId: string | undefined) {
    if (!userId) {
      setRole(null);
      return;
    }
    try {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      setRole(data?.role || "customer");
    } catch {
      setRole("customer");
    }
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next?.user?.id) {
        loadUserRole(next.user.id);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user?.id) {
        loadUserRole(data.session.user.id);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ? ({ ...session.user, role: role || undefined } as AuthUser) : null,
      loading,
    }),
    [session, role, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

