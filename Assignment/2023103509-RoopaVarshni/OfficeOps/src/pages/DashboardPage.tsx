import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Calendar, 
  ClipboardList, 
  ShieldAlert, 
  Activity, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Building,
  UserCheck,
  Bot
} from 'lucide-react';
import { User, Reservation, WorkplaceRequest, AuditEvent, TelemetryMetrics } from '../types';
import { storage } from '../services/storage';
import { Badge } from '../components/common/Badge';

interface DashboardPageProps {
  currentUser: User;
  onNavigate: (page: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentUser,
  onNavigate,
  onShowToast
}) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [requests, setRequests] = useState<WorkplaceRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryMetrics>(storage.getTelemetry());

  useEffect(() => {
    const refresh = () => {
      setReservations(storage.getReservations());
      setRequests(storage.getRequests());
      setAuditLogs(storage.getAuditLogs());
      setTelemetry(storage.getTelemetry());
    };
    refresh();
    const unsubscribe = storage.subscribe(refresh);
    return () => unsubscribe();
  }, []);

  const activeReservations = reservations.filter((r) => r.status === 'confirmed');
  const openRequests = requests.filter((r) => r.status === 'pending' || r.status === 'in_progress');
  const pendingApprovalsCount = telemetry.pendingApprovals;

  const handleQuickApproveRequest = (req: WorkplaceRequest) => {
    storage.updateRequest({
      ...req,
      status: 'approved'
    });
    storage.addAuditLog({
      actor: currentUser.name,
      actorRole: currentUser.role,
      action: 'REQUEST_APPROVED',
      targetResource: req.id,
      decision: 'approved',
      details: `Manual approval granted for request "${req.title}"`
    });
    onShowToast('Request Approved', `Ticket ${req.id} marked as Approved.`, 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                Enterprise Workspace Portal
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Welcome back, {currentUser.name}
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              {currentUser.title} &bull; <span className="text-slate-400">{currentUser.department}</span>
            </p>
          </div>

          {/* Ask OfficeOps AI CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('assistant')}
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Ask OfficeOps AI</span>
              <ArrowUpRight className="w-4 h-4 text-indigo-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Reservations */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Reservations</span>
            <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-900/40 text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{activeReservations.length}</span>
            <span className="text-xs text-slate-400">meeting spaces</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Confirmed enterprise rooms</p>
        </div>

        {/* Open Workplace Requests */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Open Service Tickets</span>
            <div className="p-2 rounded-lg bg-sky-950/60 border border-sky-900/40 text-sky-400">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{openRequests.length}</span>
            <span className="text-xs text-amber-400 font-medium">In Queue</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">IT, Facilities & Logistics</p>
        </div>

        {/* Pending Approvals */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pending HITL Approvals</span>
            <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-900/40 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{pendingApprovalsCount}</span>
            <span className="text-xs text-amber-300 font-medium">Awaiting Action</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Human governance required</p>
        </div>

        {/* Multi-Agent Health */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Agent Health Rate</span>
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-900/40 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {Math.round((telemetry.successCount / Math.max(1, telemetry.agentExecutions)) * 100)}%
            </span>
            <span className="text-xs text-emerald-400 font-medium">{telemetry.avgResponseTimeMs}ms avg</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">4 Micro-Agents operational</p>
        </div>
      </div>

      {/* Main Grid: Active Bookings & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Reservations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Active Room Reservations</h3>
                <p className="text-xs text-slate-400">Managed enterprise facility bookings</p>
              </div>
              <button
                onClick={() => onNavigate('rooms')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <span>View All Rooms</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeReservations.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No active reservations found. Use the AI Assistant to book a space.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 font-medium border-b border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Room</th>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Requester</th>
                      <th className="py-2.5 px-3">Purpose</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {activeReservations.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-semibold text-white font-sans flex items-center gap-2">
                          <Building className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{res.roomName}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {res.date} @ {res.time} ({res.durationHours}h)
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-sans">
                          {res.requesterName}
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-sans truncate max-w-[180px]">
                          {res.purpose}
                        </td>
                        <td className="py-3 px-3 font-sans">
                          <Badge variant="success" size="sm">Confirmed</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Open Workplace Requests Preview */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Open Workplace Requests</h3>
                <p className="text-xs text-slate-400">IT, Facility & Logistics tickets</p>
              </div>
              <button
                onClick={() => onNavigate('requests')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <span>Manage Tickets</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {openRequests.slice(0, 3).map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] text-indigo-400 font-semibold">{req.id}</span>
                      <span className="text-xs font-semibold text-white truncate">{req.title}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{req.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 font-mono">
                      <span>Requester: {req.requester}</span>
                      <span>&bull;</span>
                      <span className="capitalize">{req.priority} Priority</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={
                        req.priority === 'urgent'
                          ? 'danger'
                          : req.priority === 'high'
                          ? 'warning'
                          : 'default'
                      }
                      size="sm"
                    >
                      {req.priority}
                    </Badge>
                    {(currentUser.role === 'operations_manager' || currentUser.role === 'admin') && (
                      <button
                        onClick={() => handleQuickApproveRequest(req)}
                        className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-200 hover:text-white text-xs font-semibold transition-all"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Agent Pipeline & Recent Activity */}
        <div className="space-y-6">
          {/* Agent Activity Summary */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                <span>Agent Architecture</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                ACTIVE
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white">1. Requirement Agent</span>
                  <span className="text-emerald-400 font-mono text-[11px]">Ready</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  NLP Slot Extraction: date, time, capacity, hardware.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white">2. Resource Agent</span>
                  <span className="text-emerald-400 font-mono text-[11px]">Ready</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Facility inventory queries & physical constraint check.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white">3. Scheduling Agent</span>
                  <span className="text-emerald-400 font-mono text-[11px]">Ready</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Calendar collision detection & slot conflict isolation.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white">4. Recommendation Agent</span>
                  <span className="text-emerald-400 font-mono text-[11px]">Ready</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Multi-criteria scoring & transparent decision justification.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <button
                onClick={() => onNavigate('assistant')}
                className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold rounded-lg text-center transition-colors block"
              >
                Launch Multi-Agent Pipeline &rarr;
              </button>
            </div>
          </div>

          {/* Recent Audit Events */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Audit Trail</h3>
              <button
                onClick={() => onNavigate('monitoring')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Full Audit Log
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="pb-3 border-b border-slate-800/60 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-indigo-400 font-semibold">{log.action}</span>
                    <span>{log.timestamp.split('T')[1]?.slice(0, 5) || 'Recent'}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 font-sans leading-snug">{log.details}</p>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Actor: {log.actor} ({log.actorRole})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
