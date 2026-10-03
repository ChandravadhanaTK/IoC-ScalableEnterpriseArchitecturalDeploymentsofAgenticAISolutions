import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  FileText,
  User,
  Cpu,
} from 'lucide-react';
import { StorageData } from '../../services/storage';
import { formatDate } from '../../lib/utils';

interface AuditLogViewProps {
  data: StorageData;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');

  const filteredLogs = data.audit_logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === 'ALL' || log.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Enterprise Governance & Audit Trail</h2>
        <p className="text-xs text-gray-500">
          Cryptographically ordered, append-only audit trail logging all human-in-the-loop and autonomous agent actions.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit action, actor, resource ID or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-xs text-gray-700 rounded-lg px-3 py-2"
          >
            <option value="ALL">All Roles</option>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">Asset Admin</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Agent Attributed</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Resource Identifier</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No audit records matched the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-4 text-gray-400 font-mono text-[11px] whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {log.actor}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          log.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : log.role === 'manager'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {log.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-blue-600 font-medium">
                      {log.agent || 'Direct Action'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-gray-800 text-[11px]">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600">
                      {log.resource_id}
                    </td>
                    <td className="py-3 px-4 text-gray-700 max-w-sm truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
