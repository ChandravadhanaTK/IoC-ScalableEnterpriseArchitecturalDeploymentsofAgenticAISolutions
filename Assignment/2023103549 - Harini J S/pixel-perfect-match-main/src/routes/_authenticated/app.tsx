import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { BrainCircuit, FolderKanban, GitCompare, LayoutDashboard, Library, LogOut, NotebookPen, Upload, Network, Search, Sparkles, type LucideIcon } from "lucide-react";
import { useIsAdmin } from "@/hooks/use-knowledge";
import { supabase } from "@/integrations/supabase/client";
import { userDocsQuery } from "@/lib/user-docs";

export const Route = createFileRoute("/_authenticated/app")({
  beforeLoad: async ({ context }) => { await context.queryClient.ensureQueryData(userDocsQuery).catch(() => []); },
  component: AppLayout,
});

const nav: { group: string; items: { to: string; label: string; icon: LucideIcon; exact?: boolean }[] }[] = [
  { group: "Overview", items: [{ to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true }] },
  { group: "Knowledge", items: [
    { to: "/app/documents", label: "All Documents", icon: Library },
    { to: "/app/collections", label: "Collections", icon: FolderKanban },
    { to: "/app/upload", label: "Upload", icon: Upload },
    { to: "/app/notes", label: "My Notes", icon: NotebookPen },
  ] },
  { group: "Intelligence", items: [
    { to: "/app/assistant", label: "AI Assistant", icon: Sparkles },
    { to: "/app/search", label: "Semantic Search", icon: Search },
    { to: "/app/graph", label: "Knowledge Graph", icon: Network },
    { to: "/app/compare", label: "Compare Documents", icon: GitCompare },
  ] },
];

function AppLayout() {
  const { user } = Route.useRouteContext();
  const { data: isAdmin } = useIsAdmin();
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-card/40 px-3 py-5 md:flex">
        <Link to="/app" className="mb-7 flex items-center gap-2 px-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary"><BrainCircuit className="h-5 w-5" /></span>
          <span className="text-base font-semibold tracking-tight">KnowFlow</span>
        </Link>
        <nav className="space-y-5">
          {nav.map((g) => (
            <div key={g.group}>
              <p className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">{g.group}</p>
              {g.items.map((it) => (
                <Link
                  key={it.to}
                  to={it.to}
                  activeOptions={{ exact: !!it.exact }}
                  className="relative flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  activeProps={{ className: "bg-accent text-foreground before:absolute before:-left-3 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-primary" }}
                >
                  <it.icon className="h-4 w-4" />
                  {it.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="mt-auto space-y-2">
          <div className="rounded-lg border bg-background/50 px-3 py-2 text-xs text-muted-foreground">
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-success" />Mock AI
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs">{user.email}</p>
              {isAdmin && <p className="text-[10px] font-medium uppercase tracking-wider text-primary">Admin</p>}
            </div>
            <button onClick={signOut} aria-label="Sign out" className="text-muted-foreground hover:text-foreground"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 pb-24 pt-6 md:px-10 md:pb-10">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t bg-card/95 py-2 backdrop-blur md:hidden">
        {nav.flatMap((g) => g.items).filter((it) => ["/app", "/app/documents", "/app/assistant", "/app/search", "/app/graph"].includes(it.to)).map((it) => (
          <Link key={it.to} to={it.to} activeOptions={{ exact: !!it.exact }} className="flex flex-col items-center gap-0.5 px-2 text-[10px] text-muted-foreground" activeProps={{ className: "text-primary" }}>
            <it.icon className="h-5 w-5" />{it.label.split(" ").at(-1)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
