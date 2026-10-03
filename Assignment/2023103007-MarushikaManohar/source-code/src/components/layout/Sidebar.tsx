import React from "react";
import { useAppState } from "@/hooks/useAppState";
import { can, ROLE_LABEL } from "@/services/rbac";
import {
  LayoutDashboard,
  Boxes,
  PlusCircle,
  Truck,
  CheckSquare,
  Receipt,
  Cpu,
  History,
  Activity,
  Sliders,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type NavView =
  | "dashboard"
  | "inventory"
  | "replenishment"
  | "suppliers"
  | "approvals"
  | "orders"
  | "agent-ops"
  | "audit"
  | "telemetry"
  | "settings";

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView }) => {
  const state = useAppState();
  const currentUser = state.users.find((u) => u.id === state.sessionUserId) ?? state.users[0];
  const role = currentUser.role;

  const pendingApprovalsCount = state.workflows.filter((w) => w.state === "AWAITING_APPROVAL").length;
  const activeWorkflowsCount = state.workflows.filter(
    (w) => !["COMPLETED", "REJECTED", "FAILED"].includes(w.state),
  ).length;

  const navItems: Array<{
    id: NavView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeVariant?: "default" | "secondary" | "destructive" | "outline";
    restricted?: boolean;
    restrictedLabel?: string;
  }> = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inventory", label: "Inventory", icon: Boxes },
    {
      id: "replenishment",
      label: "Replenishment",
      icon: PlusCircle,
      restricted: !can(role, "REQUEST_REPLENISHMENT"),
      restrictedLabel: "Read-only for role",
    },
    { id: "suppliers", label: "Supplier Portal", icon: Truck },
    {
      id: "approvals",
      label: "Approval Center",
      icon: CheckSquare,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      badgeVariant: "destructive",
      restricted: !can(role, "REVIEW_APPROVE"),
      restrictedLabel: "Approval requires Manager/Admin",
    },
    {
      id: "orders",
      label: "Purchase Orders",
      icon: Receipt,
      badge: state.purchaseOrders.length > 0 ? state.purchaseOrders.length : undefined,
      badgeVariant: "secondary",
    },
    {
      id: "agent-ops",
      label: "Agent Operations",
      icon: Cpu,
      badge: activeWorkflowsCount > 0 ? `${activeWorkflowsCount} active` : undefined,
      badgeVariant: "outline",
    },
    { id: "audit", label: "Audit & Trace", icon: History },
    { id: "telemetry", label: "Monitoring", icon: Activity },
    {
      id: "settings",
      label: "Policy Admin",
      icon: Sliders,
      restricted: !can(role, "ADMIN_POLICIES"),
      restrictedLabel: "Admin only",
    },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card/60 flex flex-col shrink-0 select-none">
      <div className="p-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 pt-4">
        Platform Navigation
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-md font-medium transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title={item.restricted ? item.restrictedLabel : undefined}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                <span className="truncate">{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {item.badge !== undefined && (
                  <Badge
                    variant={isActive ? "secondary" : (item.badgeVariant ?? "default")}
                    className={`text-[10px] h-4 px-1.5 font-bold ${
                      isActive ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20" : ""
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
                {item.restricted && (
                  <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground/60" />
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Role & Storage Status Footer */}
      <div className="p-3 border-t border-border bg-muted/20 text-[11px] space-y-1.5">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Active Role:</span>
          <span className="font-semibold text-foreground">{ROLE_LABEL[role]}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Storage:</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400">LocalStorage v1</span>
        </div>
      </div>
    </aside>
  );
};
