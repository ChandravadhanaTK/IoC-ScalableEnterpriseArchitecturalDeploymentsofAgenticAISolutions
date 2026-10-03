import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, type Role } from "./supabase";
interface Ctx { session: Session | null; role: Role | null; loading: boolean }
const AuthCtx = createContext<Ctx>({ session: null, role: null, loading: true });
export const useAuth = () => useContext(AuthCtx);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); if (!data.session) setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); if (!s) { setRole(null); setLoading(false); } });
    return () => sub.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session) return;
    supabase.from("user_roles").select("role").eq("user_id", session.user.id).maybeSingle()
      .then(({ data }) => { setRole((data?.role as Role) ?? "student"); setLoading(false); });
  }, [session]);
  return <AuthCtx.Provider value={{ session, role, loading }}>{children}</AuthCtx.Provider>;
}
