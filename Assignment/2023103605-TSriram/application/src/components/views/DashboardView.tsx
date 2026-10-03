import React from 'react';
import {
  Boxes,
  CheckCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  Cpu,
  ArrowRight,
  TrendingUp,
  Shield,
  Search,
  HardDrive,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { StorageData } from '../../services/storage';
import { formatDate } from '../../lib/utils';

interface DashboardViewProps {
  data: StorageData;
  onNavigate: (view: string, param?: string) => void;
}

const COLORS = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#8B5CF6'];

export const DashboardView: React.FC<DashboardViewProps> = ({ data, onNavigate }) => {
  // Aggregate KPIs
  const totalAssets = data.assets.length;
  const availableAssets = data.assets.filter((a) => a.status === 'AVAILABLE').length;
  const inUseAssets = data.assets.filter((a) => a.status === 'IN_USE' || a.status === 'ASSIGNED').length;
  const inRepairAssets = data.assets.filter((a) => a.status === 'REPAIR').length;
  const replacementCandidates = data.assets.filter((a) => a.replacement_score >= 70).length;

  const totalRequests = data.asset_requests.length;
  const pendingApprovals = data.approvals.filter((a) => a.status === 'PENDING').length;
  const autoApprovedRequests = data.asset_requests.filter((r) => r.auto_approved).length;
  const rejectedRequests = data.asset_requests.filter((r) => r.status === 'REJECTED').length;

  // Chart data
  const assetStatusData = [
    { name: 'Available', value: availableAssets, color: '#16A34A' },
    { name: 'In Use', value: inUseAssets, color: '#2563EB' },
    { name: 'In Repair', value: inRepairAssets, color: '#D97706' },
    { name: 'Retired', value: data.assets.filter((a) => a.status === 'RETIRED').length, color: '#64748B' },
  ];

  const requestRiskData = [
    { name: 'LOW (Auto)', count: data.asset_requests.filter((r) => r.risk === 'LOW').length },
    { name: 'MEDIUM (Mgr)', count: data.asset_requests.filter((r) => r.risk === 'MEDIUM').length },
    { name: 'HIGH (Review)', count: data.asset_requests.filter((r) => r.risk === 'HIGH').length },
  ];

  const agentHealthList = [
    { name: 'Orchestrator Agent', status: 'Healthy', runs: data.agent_events.filter(e => e.agent.includes('Orchestrator')).length || 14, successRate: '100%' },
    { name: 'Policy Agent', status: 'Healthy', runs: data.agent_events.filter(e => e.agent.includes('Policy')).length || 22, successRate: '100%' },
    { name: 'Inventory Agent', status: 'Healthy', runs: data.agent_events.filter(e => e.agent.includes('Inventory')).length || 19, successRate: '98%' },
    { name: 'Risk Agent', status: 'Healthy', runs: data.agent_events.filter(e => e.agent.includes('Risk')).length || 18, successRate: '100%' },
    { name: 'Lifecycle Agent', status: 'Healthy', runs: data.agent_events.filter(e => e.agent.includes('Lifecycle')).length || 15, successRate: '100%' },
    { name: 'Assignment Agent', status: 'Healthy', runs: data.agent_events.filter(e => e.agent.includes('Assignment')).length || 12, successRate: '100%' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-xl shadow-slate-900/10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-500/30">
            <Cpu className="w-3.5 h-3.5" />
            <span>Autonomous IT Asset Governance</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Asset Operations Center</h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Coordinate IT assets, automate operational decisions, and keep every lifecycle action governed, traceable, and visible.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('request')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
          >
            <span>Request Asset</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('assets')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors border border-slate-700"
          >
            View Inventory
          </button>
        </div>
      </div>

      {/* KPI Cards Row 1: Assets */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          Hardware Fleet Telemetry
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="text-gray-500 text-xs font-medium flex items-center justify-between">
              <span>Total Assets</span>
              <Boxes className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-2">{totalAssets}</div>
            <div className="text-[11px] text-gray-400 mt-1">Across 5 departments</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="text-gray-500 text-xs font-medium flex items-center justify-between">
              <span>Available</span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-2">{availableAssets}</div>
            <div className="text-[11px] text-emerald-700/80 font-medium mt-1">Ready for allocation</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="text-gray-500 text-xs font-medium flex items-center justify-between">
              <span>In Use / Assigned</span>
              <HardDrive className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-600 mt-2">{inUseAssets}</div>
            <div className="text-[11px] text-gray-400 mt-1">Active deployments</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="text-gray-500 text-xs font-medium flex items-center justify-between">
              <span>In Repair</span>
              <RotateCcw className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-2">{inRepairAssets}</div>
            <div className="text-[11px] text-amber-700/80 font-medium mt-1">Under maintenance</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="text-gray-500 text-xs font-medium flex items-center justify-between">
              <span>Replace Alert</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-600 mt-2">{replacementCandidates}</div>
            <div className="text-[11px] text-rose-700/80 font-medium mt-1">Score &ge; 70 / Recurring</div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row 2: Workflow Pipeline */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          Agent Operations Pipeline
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="text-gray-500 text-xs font-medium flex items-center justify-between">
              <span>Total Requests</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-2">{totalRequests}</div>
            <div className="text-[11px] text-gray-400 mt-1">Simulated workflows</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="text-gray-500 text-xs font-medium flex items-center justify-between">
              <span>Pending Approvals</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-2">{pendingApprovals}</div>
            <div className="text-[11px] text-amber-700/80 font-medium mt-1">Human-in-the-loop</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="text-gray-500 text-xs font-medium flex items-center justify-between">
              <span>Auto Approved</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-2">{autoApprovedRequests}</div>
            <div className="text-[11px] text-emerald-700/80 font-medium mt-1">Standard LOW risk</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="text-gray-500 text-xs font-medium flex items-center justify-between">
              <span>Rejected / Failed</span>
              <Shield className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-600 mt-2">{rejectedRequests}</div>
            <div className="text-[11px] text-gray-400 mt-1">Policy enforced</div>
          </div>
        </div>
      </div>

      {/* Charts & Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fleet Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-900 text-sm">Asset Fleet Status Distribution</h4>
            <span className="text-xs text-gray-400">Real-time status</span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {assetStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value} assets`, 'Count']}
                  contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', border: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {assetStatusData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span>{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Requests by Risk Profile */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-900 text-sm">Workflows by Risk & Approval Tier</h4>
            <span className="text-xs text-gray-400">Agent Policy Routing</span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={requestRiskData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', border: 'none' }}
                />
                <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center text-xs text-gray-500 mt-2">
            Deterministic triaging enforces automated vs. manager/admin reviews
          </div>
        </div>
      </div>

      {/* Agent Health Grid */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Autonomous Agent Health Grid</h4>
            <p className="text-xs text-gray-500">6 simulated deterministic agents operating with zero cloud LLM latency</p>
          </div>
          <button
            onClick={() => onNavigate('monitoring')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Full Telemetry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {agentHealthList.map((agent) => (
            <div key={agent.name} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  {agent.status}
                </span>
              </div>
              <div className="text-xs font-bold text-gray-800 mt-2 truncate">{agent.name}</div>
              <div className="text-[11px] text-gray-500 mt-1">Runs: {agent.runs}</div>
              <div className="text-[10px] text-gray-400">Success: {agent.successRate}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Operational Events Trace */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Recent Agent Operational Events</h4>
            <p className="text-xs text-gray-500">Concise event trace (never exposing hidden chain-of-thought)</p>
          </div>
          <button
            onClick={() => onNavigate('agent-operations')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {data.agent_events.slice(0, 5).map((evt) => (
            <div key={evt.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {evt.stage}
                </span>
                <span className="font-semibold text-gray-800">{evt.agent}</span>
                <span className="text-gray-400">&bull;</span>
                <span className="text-gray-600">{evt.tool}</span>
                <span className="text-gray-400">&bull;</span>
                <span className="text-gray-900 font-medium truncate max-w-md">{evt.result}</span>
              </div>
              <div className="flex items-center gap-4 text-gray-400 text-[11px]">
                <span>{evt.duration}ms</span>
                <span>{formatDate(evt.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
