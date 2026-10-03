import { NavLink, Outlet, Navigate } from "react-router-dom";
import { LayoutDashboard, Library, Brain, BarChart3, ListChecks, User, Shield, LogOut } from "lucide-react";
import { useAuth } from "../lib/auth";
import { supabase, type Role } from "../lib/supabase";
const nav = [["/dashboard", "Dashboard", LayoutDashboard], ["/library", "Library", Library], ["/quiz", "Quiz", Brain], ["/results", "Results", BarChart3], ["/study-plan", "Study Plan", ListChecks], ["/profile", "Profile", User], ["/admin", "Admin", Shield]] as const;
export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { session, role, loading } = useAuth();
  if (loading) return <p className="text-muted p-8">Loading…</p>;
  if (!session) return <Navigate to="/login" replace />;
  if (roles && role && !roles.includes(role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
export function Layout() {
  const { role } = useAuth();
  const items = nav.filter(([to]) => to !== "/admin" || role === "admin");
  return (<div className="flex min-h-screen">
    <aside className="bg-card hidden w-60 shrink-0 flex-col gap-1 p-4 md:flex"><p className="text-primary mb-4 text-lg font-extrabold">EduMentor AI</p>
      {items.map(([to, l, Icon]) => <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${isActive ? "bg-primary font-bold text-black" : "hover:bg-alt"}`}><Icon size={18} />{l}</NavLink>)}
      <button onClick={() => supabase.auth.signOut()} className="hover:bg-alt mt-auto flex items-center gap-3 rounded-xl px-3 py-2 text-sm"><LogOut size={18} />Logout</button></aside>
    <main className="flex-1 p-6 pb-24 md:pb-6"><Outlet /></main>
    <nav className="bg-card fixed inset-x-0 bottom-0 flex justify-around p-3 md:hidden">{items.slice(0, 6).map(([to, l, Icon]) => <NavLink key={to} to={to} aria-label={l} className={({ isActive }) => isActive ? "text-primary" : ""}><Icon size={22} /></NavLink>)}</nav></div>);
}
