import React, { useState } from 'react';
import {
  Cpu,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { StorageData } from '../../services/storage';
import { formatDate } from '../../lib/utils';

interface AgentOperationsViewProps {
  data: StorageData;
  onNavigateToWorkflow: (requestId: string) => void;
}

export const AgentOperationsView: React.FC<AgentOperationsViewProps> = ({
  data,
  onNavigateToWorkflow,
}) => {
  const [selectedAgent, setSelectedAgent] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const agentsList = [
    'Orchestrator Agent',
    'Policy Agent',
    'Inventory Agent',
    'Risk Agent',
    'Lifecycle Agent',
    'Assignment Agent',
  ];

  const filteredEvents = data.agent_events.filter((e) => {
    const matchesAgent = selectedAgent === 'ALL' || e.agent === selectedAgent;
    const matchesStatus = selectedStatus === 'ALL' || e.status === selectedStatus;
    const matchesSearch =
      e.result.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tool.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.request_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAgent && matchesStatus && matchesSearch;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Agent Operations Telemetry</h2>
        <p className="text-xs text-gray-500">
          Deterministic execution log of autonomous agent activities, tool interactions, and decision parameters.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search event result, tool, or request ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-xs text-gray-700 rounded-lg px-3 py-2"
          >
            <option value="ALL">All Agents</option>
            {agentsList.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-xs text-gray-700 rounded-lg px-3 py-2"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Request</th>
                <th className="py-3 px-4">Agent</th>
                <th className="py-3 px-4">Tool Invoked</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Execution Result</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No agent events recorded under selected filters.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => {
                  const req = data.asset_requests.find((r) => r.id === evt.request_id);
                  return (
                    <tr key={evt.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4 text-gray-400 font-mono text-[11px] whitespace-nowrap">
                        {formatDate(evt.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        {req ? (
                          <button
                            onClick={() => onNavigateToWorkflow(req.id)}
                            className="font-mono text-blue-600 font-bold hover:underline flex items-center gap-1"
                          >
                            <span>{req.code}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="font-mono text-gray-400">{evt.request_id}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-800">
                        {evt.agent}
                      </td>
                      <td className="py-3 px-4 font-semibold text-blue-700">
                        {evt.tool}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {evt.stage}
                      </td>
                      <td className="py-3 px-4 text-gray-800 font-medium max-w-sm truncate">
                        {evt.result}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-500 text-[11px]">
                        {evt.duration}ms
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            evt.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : evt.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {evt.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
