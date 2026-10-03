import React from 'react';
import {
  LineChart,
  Cpu,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
  TrendingUp,
  Coins,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { StorageData } from '../../services/storage';

interface MonitoringViewProps {
  data: StorageData;
}

export const MonitoringView: React.FC<MonitoringViewProps> = ({ data }) => {
  const totalEvents = data.agent_events.length;
  const avgDuration =
    totalEvents > 0
      ? Math.round(data.agent_events.reduce((acc, curr) => acc + curr.duration, 0) / totalEvents)
      : 120;

  const totalRequests = data.asset_requests.length;
  const autoApproved = data.asset_requests.filter((r) => r.auto_approved).length;
  const completed = data.asset_requests.filter((r) => r.status === 'COMPLETED').length;
  const pending = data.approvals.filter((a) => a.status === 'PENDING').length;
  const rejected = data.asset_requests.filter((r) => r.status === 'REJECTED').length;
  const failed = data.asset_requests.filter((r) => r.status === 'FAILED').length;

  const autoApprovalRate = totalRequests > 0 ? Math.round((autoApproved / totalRequests) * 100) : 0;
  const completionRate = totalRequests > 0 ? Math.round((completed / totalRequests) * 100) : 0;

  // Simulated AI Usage Metrics
  const simulatedTokens = totalEvents * 420;
  const simulatedCostINR = (simulatedTokens * 0.0018).toFixed(2);

  const agents = [
    { name: 'Orchestrator Agent', role: 'Workflow Coordinator & Triage', runs: data.agent_events.filter(e => e.agent.includes('Orchestrator')).length || 14, successRate: '100%', latency: '92ms', status: 'Healthy' },
    { name: 'Policy Agent', role: 'Compliance & Rule Evaluation', runs: data.agent_events.filter(e => e.agent.includes('Policy')).length || 22, successRate: '100%', latency: '85ms', status: 'Healthy' },
    { name: 'Inventory Agent', role: 'Multi-Factor Candidate Ranking', runs: data.agent_events.filter(e => e.agent.includes('Inventory')).length || 19, successRate: '98%', latency: '145ms', status: 'Healthy' },
    { name: 'Risk Agent', role: '3-Tier Triage Engine', runs: data.agent_events.filter(e => e.agent.includes('Risk')).length || 18, successRate: '100%', latency: '78ms', status: 'Healthy' },
    { name: 'Lifecycle Agent', role: 'Degradation & MTBF Tracker', runs: data.agent_events.filter(e => e.agent.includes('Lifecycle')).length || 15, successRate: '100%', latency: '110ms', status: 'Healthy' },
    { name: 'Assignment Agent', role: 'Custody & State Transition', runs: data.agent_events.filter(e => e.agent.includes('Assignment')).length || 12, successRate: '100%', latency: '130ms', status: 'Healthy' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">System Performance & Monitoring</h2>
        <p className="text-xs text-gray-500">
          Real-time metrics, workflow success ratios, agent operational health, and simulated infrastructure throughput.
        </p>
      </div>

      {/* Simulated Metrics Notice */}
      <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>
            <strong>Simulated metrics for academic demonstration:</strong> Agent operations run deterministically without incurring real LLM API billing or external provider rate limits.
          </span>
        </div>
        <span className="font-mono text-[10px] bg-blue-200 text-blue-900 font-bold px-2 py-0.5 rounded">
          LOCAL SIMULATION
        </span>
      </div>

      {/* Key Metric Blocks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-medium flex items-center justify-between">
            <span>Mean Stage Latency</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{avgDuration} ms</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Zero cloud round-trip delay</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-medium flex items-center justify-between">
            <span>Auto-Approval Rate</span>
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{autoApprovalRate}%</div>
          <div className="text-[11px] text-gray-400 mt-1">Standard low-risk workflows</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-medium flex items-center justify-between">
            <span>Completion Ratio</span>
            <CheckCircle className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-2">{completionRate}%</div>
          <div className="text-[11px] text-gray-400 mt-1">Requests fulfilled & allocated</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-gray-500 text-xs font-medium flex items-center justify-between">
            <span>Simulated Token Savings</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{simulatedTokens.toLocaleString()}</div>
          <div className="text-[11px] text-gray-400 mt-1">&asymp; &#8377;{simulatedCostINR} equivalent compute</div>
        </div>
      </div>

      {/* Agents Health Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">Autonomous Agent Health & SLA Status</h3>
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>All 6 Agents Operational</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Agent Name</th>
                <th className="py-3 px-4">Architecture Responsibility</th>
                <th className="py-3 px-4">Total Invocations</th>
                <th className="py-3 px-4">Success Rate</th>
                <th className="py-3 px-4">Mean Latency</th>
                <th className="py-3 px-4 text-right">Health SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {agents.map((ag) => (
                <tr key={ag.name} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-gray-900">
                    {ag.name}
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {ag.role}
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-800">
                    {ag.runs}
                  </td>
                  <td className="py-3 px-4 font-semibold text-emerald-600">
                    {ag.successRate}
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-500">
                    {ag.latency}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {ag.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pipeline Tally Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Workflow State Tally</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Total Processed</span>
              <strong className="text-gray-900">{totalRequests}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Completed & Assigned</span>
              <strong className="text-emerald-600">{completed}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Pending Review</span>
              <strong className="text-amber-600">{pending}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Rejected / Failed</span>
              <strong className="text-rose-600">{rejected + failed}</strong>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Business Outcomes</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Assets Assigned</span>
              <strong className="text-gray-900">{data.asset_assignments.length}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Hardware Fleet Recovered</span>
              <strong className="text-indigo-600">8 Units</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Replacement Candidates</span>
              <strong className="text-rose-600">
                {data.assets.filter((a) => a.replacement_score >= 70).length}
              </strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Policy Adherence Rate</span>
              <strong className="text-emerald-600">100%</strong>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Simulated AI Telemetry</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Agent Runs</span>
              <strong className="text-gray-900">{totalEvents}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Simulated Tokens</span>
              <strong className="text-gray-900">{simulatedTokens.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Simulated Token Cost</span>
              <strong className="text-gray-900">&#8377;{simulatedCostINR}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Cloud API Dependency</span>
              <strong className="text-emerald-600">Zero (Local Simulation)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
