import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Download, 
  RotateCcw, 
  ShieldCheck, 
  Bot, 
  Terminal,
  Zap,
  TrendingUp,
  Server
} from 'lucide-react';
import { User, AuditEvent, TelemetryMetrics } from '../types';
import { storage } from '../services/storage';
import { Badge } from '../components/common/Badge';

interface MonitoringPageProps {
  currentUser: User;
  onResetData: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const MonitoringPage: React.FC<MonitoringPageProps> = ({
  currentUser,
  onResetData,
  onShowToast
}) => {
  const [telemetry, setTelemetry] = useState<TelemetryMetrics>(storage.getTelemetry());
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [filterAction, setFilterAction] = useState<string>('all');

  useEffect(() => {
    const refresh = () => {
      setTelemetry(storage.getTelemetry());
      setAuditLogs(storage.getAuditLogs());
    };
    refresh();
    const unsub = storage.subscribe(refresh);
    return () => unsub();
  }, []);

  const handleExportAuditLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `officeops_audit_ledger_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('Audit Log Exported', 'Saved immutable audit trail JSON file.', 'success');
  };

  const agentHealthMatrix = [
    {
      name: 'Requirement Agent',
      service: 'nlp.slot-filling.v2',
      status: 'Healthy',
      executions: Math.round(telemetry.agentExecutions * 0.28),
      avgLatencyMs: 42,
      errorRate: '0.0%',
      type: 'NLU / Extraction'
    },
    {
      name: 'Resource Agent',
      service: 'inventory.catalog.v1',
      status: 'Healthy',
      executions: Math.round(telemetry.agentExecutions * 0.26),
      avgLatencyMs: 58,
      errorRate: '0.2%',
      type: 'Inventory Query'
    },
    {
      name: 'Scheduling Agent',
      service: 'temporal.conflict.v3',
      status: 'Healthy',
      executions: Math.round(telemetry.agentExecutions * 0.24),
      avgLatencyMs: 64,
      errorRate: '0.8%',
      type: 'Calendar Engine'
    },
    {
      name: 'Recommendation Agent',
      service: 'decision.ranker.v2',
      status: 'Healthy',
      executions: Math.round(telemetry.agentExecutions * 0.22),
      avgLatencyMs: 76,
      errorRate: '0.1%',
      type: 'Multi-Factor Scorer'
    }
  ];

  const filteredLogs = auditLogs.filter((log) => {
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Telemetry Disclaimer Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-xs">
        <div className="flex items-center gap-2.5 text-indigo-300">
          <Server className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            <strong>[SIMULATED DEMO TELEMETRY]:</strong> Metrics reflect live session state combined with deterministic enterprise baseline telemetry.
          </span>
        </div>
        <span className="font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 shrink-0">
          PIPELINE: NORMAL
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <span>Multi-Agent System Telemetry & Observability</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time pipeline metrics, agent health state matrix, and cryptographic audit log
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAuditLogs}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Log (JSON)</span>
          </button>

          {(currentUser.role === 'admin' || currentUser.role === 'operations_manager') && (
            <button
              onClick={onResetData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo State</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Visual Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-medium">Total Requests</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{telemetry.totalRequests}</div>
          <div className="text-[11px] text-slate-400 mt-1">Workplace queries logged</div>
        </div>

        {/* Total Agent Executions */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-medium">Agent Executions</span>
            <Cpu className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{telemetry.agentExecutions}</div>
          <div className="text-[11px] text-slate-400 mt-1">Micro-agent task invocations</div>
        </div>

        {/* Success Rate */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-medium">Pipeline Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono">
            {Math.round((telemetry.successCount / Math.max(1, telemetry.agentExecutions)) * 100)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{telemetry.failureCount} failed constraint runs</div>
        </div>

        {/* Avg Response Time */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-medium">Average Latency</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-300 font-mono">{telemetry.avgResponseTimeMs} ms</div>
          <div className="text-[11px] text-slate-400 mt-1">End-to-end multi-agent pipeline</div>
        </div>
      </div>

      {/* Agent Activity Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>Micro-Agent Health & Runtime Matrix</span>
            </h3>
            <p className="text-xs text-slate-400">Isolated agent microservice health checkpoints</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-md">
            All 4 Agents Operational
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Agent Subsystem</th>
                <th className="py-3 px-4">Service Endpoint</th>
                <th className="py-3 px-4">Functional Role</th>
                <th className="py-3 px-4">Health Status</th>
                <th className="py-3 px-4">Invocations</th>
                <th className="py-3 px-4">Avg Latency</th>
                <th className="py-3 px-4">Error Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {agentHealthMatrix.map((agent, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white font-sans flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{agent.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-indigo-400">
                    {agent.service}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-sans">
                    {agent.type}
                  </td>
                  <td className="py-3.5 px-4 font-sans">
                    <Badge variant="success" size="sm">
                      {agent.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-slate-200">
                    {agent.executions}
                  </td>
                  <td className="py-3.5 px-4 text-slate-200">
                    {agent.avgLatencyMs} ms
                  </td>
                  <td className="py-3.5 px-4 text-emerald-400">
                    {agent.errorRate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Immutable Governance Audit Trail</span>
            </h3>
            <p className="text-xs text-slate-400">Chronological ledger of agent proposals, human approvals, and commits</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
            >
              <option value="all">All Events</option>
              <option value="AGENT_PIPELINE_INITIATED">AGENT_PIPELINE_INITIATED</option>
              <option value="HUMAN_APPROVAL_COMMITTED">HUMAN_APPROVAL_COMMITTED</option>
              <option value="HUMAN_APPROVAL_REJECTED">HUMAN_APPROVAL_REJECTED</option>
              <option value="SERVICE_REQUEST_FILED">SERVICE_REQUEST_FILED</option>
              <option value="USER_LOGIN">USER_LOGIN</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action Token</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-indigo-400">
                    {log.id}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {log.timestamp.replace('T', ' ').slice(0, 19)}
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-200">
                    <div>{log.actor}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{log.actorRole}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-semibold">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 font-sans text-white">
                    {log.targetResource}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <Badge
                      variant={
                        log.decision === 'approved'
                          ? 'success'
                          : log.decision === 'rejected'
                          ? 'danger'
                          : 'default'
                      }
                      size="sm"
                    >
                      {log.decision}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-300 truncate max-w-sm">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
