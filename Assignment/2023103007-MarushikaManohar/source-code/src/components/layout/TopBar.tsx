import React, { useState } from "react";
import { useAppState } from "@/hooks/useAppState";
import { switchPersona, markNotificationsRead, sweepApprovalSla, resetSeed } from "@/services/actions";
import { ROLE_LABEL, ROLE_PERMISSIONS } from "@/services/rbac";
import {
  Bell,
  CheckCircle,
  Clock,
  RotateCcw,
  Shield,
  UserCheck,
  AlertTriangle,
  Info,
  ChevronDown,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TopBarProps {
  onSelectView?: (view: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onSelectView }) => {
  const state = useAppState();
  const currentUser = state.users.find((u) => u.id === state.sessionUserId) ?? state.users[0];
  const permissions = ROLE_PERMISSIONS[currentUser.role] ?? [];

  const unreadNotifications = state.notifications.filter(
    (n) => !n.read && n.targetRoles.includes(currentUser.role),
  );

  const pendingApprovalsCount = state.workflows.filter((w) => w.state === "AWAITING_APPROVAL").length;

  const [slaMessage, setSlaMessage] = useState<string | null>(null);

  const handleSweepSla = () => {
    const escalated = sweepApprovalSla();
    setSlaMessage(
      escalated > 0
        ? `SLA Sweep: Escalated ${escalated} timed-out workflow(s)`
        : "SLA Sweep: No pending workflows currently breached SLA",
    );
    setTimeout(() => setSlaMessage(null), 4000);
  };

  const handleResetData = () => {
    if (window.confirm("Reset all operational data back to the clean deterministic seed?")) {
      try {
        resetSeed();
      } catch (e) {
        alert((e as Error).message);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
      {/* Brand & Platform Identity */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-foreground sm:text-lg">
              SupplyChainIQ
            </span>
            <Badge variant="outline" className="hidden border-primary/30 bg-primary/5 text-primary text-[10px] font-semibold sm:inline-flex">
              Deterministic Multi-Agent
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground hidden sm:block">
            Enterprise Autonomous Inventory & Replenishment Platform
          </p>
        </div>
      </div>

      {/* Middle SLA indicator / Quick Notification */}
      {slaMessage && (
        <div className="hidden items-center gap-2 rounded-md bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 border border-amber-500/20 md:flex animate-in fade-in">
          <Clock className="h-3.5 w-3.5" />
          <span>{slaMessage}</span>
        </div>
      )}

      {/* Right Controls: SLA Sweep, Notifications, Persona Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Manual SLA sweep trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSweepSla}
          title="Sweep pending workflows against approval SLA"
          className="hidden lg:inline-flex text-xs h-8 gap-1.5"
        >
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Check SLA</span>
        </Button>

        {/* Notifications Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
              <Bell className="h-4 w-4 text-foreground" />
              {unreadNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unreadNotifications.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 sm:w-96 shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Notifications</span>
                <Badge variant="secondary" className="text-[10px]">
                  {unreadNotifications.length} unread
                </Badge>
              </div>
              {unreadNotifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markNotificationsRead()}
                  className="text-xs h-7 text-muted-foreground hover:text-foreground"
                >
                  Mark read
                </Button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto divide-y">
              {state.notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No notifications recorded yet.
                </div>
              ) : (
                state.notifications.slice(-10).reverse().map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 text-xs transition-colors ${
                      !n.read ? "bg-muted/40 font-medium" : "text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {n.kind === "APPROVAL_REQUIRED" && (
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      {n.kind === "ESCALATION" && (
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      )}
                      {n.kind === "FAILURE" && (
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      )}
                      {n.kind === "INFO" && (
                        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-foreground leading-snug">{n.message}</p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                          {n.workflowId && (
                            <span className="font-mono bg-muted px-1 rounded">{n.workflowId}</span>
                          )}
                          <span>{new Date(n.at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Persistent Persona Switcher (Section 2 RBAC requirement) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 px-2 sm:px-3 text-left"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden text-left text-xs sm:block">
                <div className="font-semibold text-foreground leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-muted-foreground">{ROLE_LABEL[currentUser.role]}</div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="text-xs">
              <span className="text-muted-foreground">Active Persona (RBAC Evaluator):</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {state.users.map((u) => {
              const isActive = u.id === currentUser.id;
              return (
                <DropdownMenuItem
                  key={u.id}
                  onClick={() => switchPersona(u.id)}
                  className={`flex flex-col items-start gap-0.5 py-2 cursor-pointer ${
                    isActive ? "bg-muted font-medium" : ""
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-semibold">{u.name}</span>
                    {isActive && <Badge variant="secondary" className="text-[10px]">Active</Badge>}
                  </div>
                  <span className="text-xs text-primary font-medium">{ROLE_LABEL[u.role]}</span>
                  <span className="text-[10px] text-muted-foreground">{u.title}</span>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-[11px] text-muted-foreground">
              <div className="font-medium text-foreground mb-1">Effective Role Permissions:</div>
              <div className="flex flex-wrap gap-1">
                {permissions.map((p) => (
                  <span key={p} className="bg-muted px-1.5 py-0.5 rounded text-[9px] font-mono">
                    {p}
                  </span>
                ))}
              </div>
            </div>
            {currentUser.role === "ADMINISTRATOR" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleResetData}
                  className="text-destructive focus:text-destructive text-xs cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-2" />
                  Reset to Seed Data
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
