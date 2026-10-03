import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar, type NavView } from "@/components/layout/Sidebar";
import { DashboardView } from "@/components/views/DashboardView";
import { InventoryView } from "@/components/views/InventoryView";
import { ReplenishmentView } from "@/components/views/ReplenishmentView";
import { SupplierPortalView } from "@/components/views/SupplierPortalView";
import { ApprovalCenterView } from "@/components/views/ApprovalCenterView";
import { PurchaseOrdersView } from "@/components/views/PurchaseOrdersView";
import { AgentOperationsView } from "@/components/views/AgentOperationsView";
import { AuditTraceView } from "@/components/views/AuditTraceView";
import { MonitoringTelemetryView } from "@/components/views/MonitoringTelemetryView";
import { SettingsPolicyView } from "@/components/views/SettingsPolicyView";
import { sweepApprovalSla } from "@/services/actions";

export const Route = createFileRoute("/")({
  component: SupplyChainIQApp,
});

function SupplyChainIQApp() {
  const [currentView, setCurrentView] = useState<NavView>("dashboard");
  const [navParams, setNavParams] = useState<{
    workflowId?: string;
    productId?: string;
    warehouseId?: string;
  }>({});

  // Background interval for SLA timeouts (Failure Mode E)
  useEffect(() => {
    const timer = setInterval(() => {
      sweepApprovalSla();
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  const handleNavigate = (
    view: NavView,
    params?: { workflowId?: string; productId?: string; warehouseId?: string },
  ) => {
    if (params) setNavParams(params);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Top Header with Persona Switcher and Global Controls */}
      <TopBar onSelectView={(v) => handleNavigate(v as NavView)} />

      {/* Main Body with Sidebar + Active View Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar currentView={currentView} onSelectView={(v) => handleNavigate(v)} />

        {/* Dynamic View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {currentView === "dashboard" && <DashboardView onNavigate={handleNavigate} />}
            {currentView === "inventory" && <InventoryView onNavigate={handleNavigate} />}
            {currentView === "replenishment" && (
              <ReplenishmentView
                onNavigate={handleNavigate}
                prefillProduct={navParams.productId}
                prefillWarehouse={navParams.warehouseId}
              />
            )}
            {currentView === "suppliers" && <SupplierPortalView />}
            {currentView === "approvals" && (
              <ApprovalCenterView
                onNavigateToTrace={(wfId) => handleNavigate("agent-ops", { workflowId: wfId })}
              />
            )}
            {currentView === "orders" && <PurchaseOrdersView />}
            {currentView === "agent-ops" && (
              <AgentOperationsView initialWorkflowId={navParams.workflowId} />
            )}
            {currentView === "audit" && <AuditTraceView />}
            {currentView === "telemetry" && <MonitoringTelemetryView />}
            {currentView === "settings" && <SettingsPolicyView onNavigate={handleNavigate} />}
          </div>
        </main>
      </div>
    </div>
  );
}
