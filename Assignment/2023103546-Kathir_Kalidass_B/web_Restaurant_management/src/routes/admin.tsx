import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ClipboardList,
  LayoutGrid,
  BookOpen,
  CalendarDays,
  Package,
  ChefHat,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — CHEFSTATION" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList },
  { to: "/admin/tables", label: "Tables", icon: LayoutGrid },
  { to: "/admin/menu", label: "Menu", icon: BookOpen },
  { to: "/admin/reservations", label: "Reservations", icon: CalendarDays },
  { to: "/admin/inventory", label: "Inventory", icon: Package },
] as const;

function AdminLayout() {
  const { user, roles, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = roles.some((r) => ["admin", "super_admin"].includes(r));

  if (loading) return null;
  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <ChefHat className="h-12 w-12 text-primary" />
        <h1 className="font-display text-2xl font-bold text-foreground">Admin Access Required</h1>
        <p className="text-sm text-muted-foreground">Sign in with an admin account to continue.</p>
        <Link to="/login" className="rounded-md bg-primary px-5 py-2.5 font-bold text-primary-foreground btn-glow">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="border-b border-border p-4">
          <Link to="/" className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-primary" />
            <span className="font-display text-lg font-bold text-gold-gradient">CHEFSTATION</span>
          </Link>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">Admin Console</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((n) => {
            const active = "exact" in n && n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-card-alt hover:text-foreground"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary">← Back to site</Link>
        </div>
      </aside>

      <div className="flex-1 overflow-auto">
        {/* Mobile nav */}
        <div className="flex gap-1 overflow-x-auto border-b border-border bg-card p-2 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
            >
              <n.icon className="h-3.5 w-3.5" /> {n.label}
            </Link>
          ))}
        </div>
        <Outlet />
      </div>
    </div>
  );
}
