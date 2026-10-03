import { Link } from "@tanstack/react-router";
import { Bell, RotateCcw, Boxes } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLES, inr, type Role } from "@/lib/procure/data";
import { useProcure } from "@/lib/procure/store";

export function TopBar() {
  const { role, setRole, requests, reset } = useProcure();
  const pending = requests.filter((r) =>
    role === "Manager" ? r.status === "pending_manager" : role === "Procurement Officer" ? r.status === "approved" : r.status === "changes_requested",
  );
  const linkCls = "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground";
  return (
    <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-2.5">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-ink text-ink-foreground"><Boxes className="h-4 w-4" /></span>
          <span className="font-display text-lg font-bold">ProcureAI</span>
        </Link>
        <Badge className="bg-warning font-mono text-[10px] tracking-widest text-warning-foreground hover:bg-warning">DEMO</Badge>
        <nav className="ml-2 flex gap-1">
          <Link to="/" className={linkCls} activeOptions={{ exact: true }} activeProps={{ className: "bg-secondary text-foreground" }}>Analyze</Link>
          <Link to="/approvals" className={linkCls} activeProps={{ className: "bg-secondary text-foreground" }}>Approvals</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className="eyebrow hidden sm:inline">Role</span>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="h-9 w-[190px]"><SelectValue /></SelectTrigger>
            <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                {pending.length > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-ai px-1 text-[10px] font-bold text-ai-foreground">{pending.length}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <p className="eyebrow mb-2">Needs your attention · {role}</p>
              {pending.length === 0 ? <p className="text-sm text-muted-foreground">Nothing pending.</p> : (
                <ul className="space-y-2">
                  {pending.slice(0, 6).map((r) => (
                    <li key={r.id} className="text-sm"><span className="font-mono text-xs text-muted-foreground">{r.id}</span> {r.text.slice(0, 50)} · {inr(r.result.total)}</li>
                  ))}
                </ul>
              )}
              <Link to="/approvals" className="mt-3 block text-sm font-medium text-primary">Open approvals →</Link>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={() => { reset(); toast.success("Demo data reset"); }}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset demo data
          </Button>
        </div>
      </div>
    </header>
  );
}
