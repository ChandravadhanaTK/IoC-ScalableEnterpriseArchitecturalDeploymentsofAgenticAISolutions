import React, { useState } from 'react';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Download, Search, AlertOctagon, CheckCircle2, RefreshCw, Lock, ExternalLink } from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const { auditLogs, verifyAuditChain, simulateAuditTamper } = useTasks();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [chainVerification, setChainVerification] = useState<{ valid: boolean; brokenAtIndex?: number } | null>(null);

  const filteredLogs = auditLogs.filter((log) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchUser = log.userName.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      if (!matchDetails && !matchUser && !matchAction) return false;
    }
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    return true;
  });

  const handleVerify = () => {
    const res = verifyAuditChain();
    setChainVerification(res);
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(auditLogs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-agent-audit-trail-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            SOC 2 / ISO 27001 Compliance Ledger
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Cryptographic Audit Trail
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Tamper-evident SHA-256 hash-chained log recording all agent actions, HITL approvals, and prioritizations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleVerify}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verify Hashes
          </button>
          <button
            onClick={() => {
              simulateAuditTamper();
              handleVerify();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition shadow"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            Test Tamper
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Chain Status Notification */}
      {chainVerification && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            chainVerification.valid
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {chainVerification.valid ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>All {auditLogs.length} blocks mathematically verified. Zero hash collisions or tampering found.</span>
              </>
            ) : (
              <>
                <AlertOctagon className="w-4 h-4 text-red-400" />
                <span>TAMPER DETECTED! Hash chaining disrupted at Block #{chainVerification.brokenAtIndex}.</span>
              </>
            )}
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            Hash Standard: SHA-256
          </span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by action, user, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
        >
          <option value="all">All Actions</option>
          <option value="TASK_CREATED">TASK_CREATED</option>
          <option value="TASK_UPDATED">TASK_UPDATED</option>
          <option value="TASK_COMPLETED">TASK_COMPLETED</option>
          <option value="AUTO_PRIORITIZATION_EXECUTED">AUTO_PRIORITIZATION_EXECUTED</option>
          <option value="HITL_APPROVAL_GRANTED">HITL_APPROVAL_GRANTED</option>
          <option value="POLICY_ENFORCED">POLICY_ENFORCED</option>
        </select>
      </div>

      {/* Audit Log Entries List */}
      <div className="space-y-3">
        {filteredLogs.slice().reverse().map((entry, idx) => (
          <div
            key={entry.id}
            className={`p-4 rounded-xl border text-xs space-y-2 transition ${
              entry.verified === false
                ? 'border-red-500/50 bg-red-950/20'
                : 'border-slate-800 bg-slate-900/70'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-slate-500">#{auditLogs.length - idx}</span>
                <span className="font-bold text-white font-mono bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                  {entry.action}
                </span>
                <span className="text-slate-400">by</span>
                <span className="font-semibold text-indigo-300">{entry.userName}</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                  {entry.userRole}
                </span>
              </div>

              <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
                <span>{new Date(entry.timestamp).toLocaleString()}</span>
                <span>{entry.ipAddress}</span>
              </div>
            </div>

            <p className="text-slate-300 font-sans leading-relaxed">
              {entry.details}
            </p>

            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono text-slate-500">
              <div className="truncate">
                <span className="text-slate-400">Prev Block Hash: </span>
                {entry.previousHash}
              </div>
              <div className="truncate">
                <span className="text-emerald-400">Current Hash: </span>
                {entry.hash}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
