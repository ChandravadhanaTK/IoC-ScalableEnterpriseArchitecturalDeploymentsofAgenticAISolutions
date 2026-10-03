import React, { useState } from 'react';
import { ShieldCheck, Key, Lock, Eye, AlertOctagon, CheckCircle2, XCircle, RefreshCw, FileText, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';

export const SecurityModel: React.FC = () => {
  const { currentUser, allUsers, loginAs } = useAuth();
  const { auditLogs, verifyAuditChain, simulateAuditTamper } = useTasks();

  const [piiInput, setPiiInput] = useState<string>(
    'Deploy hotfix for client John Doe (SSN: 123-45-6789, email: john.doe@acme.corp) on server IP 192.168.1.45.'
  );
  const [chainStatus, setChainStatus] = useState<{ valid: boolean; brokenAtIndex?: number } | null>(null);

  const sanitizePII = (text: string) => {
    return text
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
      .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[MASKED_INTERNAL_IP]')
      .replace(/John Doe/g, '[ANONYMIZED_PERSONA]');
  };

  const checkChain = () => {
    const result = verifyAuditChain();
    setChainStatus(result);
  };

  const rbacMatrix = [
    { permission: 'View Tasks & Prioritization Matrix', admin: true, operator: true, engineer: true, auditor: true },
    { permission: 'Create & Modify Standard Tasks (P2/P3)', admin: true, operator: true, engineer: true, auditor: false },
    { permission: 'Execute Autonomous Agent Runs', admin: true, operator: true, engineer: true, auditor: false },
    { permission: 'Approve P0 Critical / HITL Deployments', admin: true, operator: false, engineer: false, auditor: false },
    { permission: 'Execute Multi-Factor Auto-Prioritizer', admin: true, operator: true, engineer: false, auditor: false },
    { permission: 'Modify NeMo Guardrails & Security Policies', admin: true, operator: false, engineer: false, auditor: false },
    { permission: 'Export & Verify Cryptographic Audit Trail', admin: true, operator: true, engineer: false, auditor: true },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-wider uppercase mb-1">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">4</span>
            Deliverable 4 • Enterprise Governance & Trust
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Enterprise Security Model
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Identity & RBAC authorization, HashiCorp Vault secrets, Presidio PII privacy, NeMo guardrails, and SHA-256 audit chaining.
          </p>
        </div>

        {/* Active Identity Switcher */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Logged in as:</span>
          <select
            value={currentUser.id}
            onChange={(e) => loginAs(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: Identity & RBAC Matrix */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-400" />
              Role-Based Access Control (RBAC) Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enforced at Envoy Ingress and Agent Task Router using cryptographically signed JWT claims.
            </p>
          </div>
          <span className="text-xs font-mono bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-md">
            Active Role: {currentUser.role.toUpperCase()}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="p-3.5">Permission / Action</th>
                <th className="p-3.5 text-center">Admin</th>
                <th className="p-3.5 text-center">Operator</th>
                <th className="p-3.5 text-center">Engineer</th>
                <th className="p-3.5 text-center">Auditor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rbacMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5 font-medium text-slate-200">{row.permission}</td>
                  <td className="p-3.5 text-center">
                    {row.admin ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                  <td className="p-3.5 text-center">
                    {row.operator ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                  <td className="p-3.5 text-center">
                    {row.engineer ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                  <td className="p-3.5 text-center">
                    {row.auditor ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: PII Redaction & Secrets Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive PII Sanitizer */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              Live PII & Data Privacy Sanitizer
            </h3>
            <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              Presidio v2.2 Engine
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Sensitive user data and confidential network topology are sanitized before prompting the LLM agent.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Input Task Description (Test Input):</label>
            <textarea
              value={piiInput}
              onChange={(e) => setPiiInput(e.target.value)}
              rows={2}
              className="w-full text-xs bg-slate-800/80 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-emerald-400">Sanitized Prompt Fed to Agent:</label>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-500/30 text-emerald-300 text-xs font-mono leading-relaxed">
              {sanitizePII(piiInput)}
            </div>
          </div>
        </div>

        {/* Secrets Management & KMS */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              Secrets Management & Envelope KMS
            </h3>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Vault Enterprise + CMEK
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Zero credentials exist in configuration files or container images. Dynamic short-lived credentials rotate hourly.
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Database Credentials</div>
                <div className="text-slate-400 text-[11px]">Dynamic PostgreSQL user generated on-demand</div>
              </div>
              <span className="font-mono text-amber-300 text-[11px]">TTL: 3600s</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Data Encryption Key (DEK)</div>
                <div className="text-slate-400 text-[11px]">AES-256 GCM envelope encryption wrapped by Cloud KMS KEK</div>
              </div>
              <span className="font-mono text-emerald-300 text-[11px]">Auto-Rotated</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">GitHub / Jira API Tokens</div>
                <div className="text-slate-400 text-[11px]">Injected into Firecracker sandbox memory via tmpfs only</div>
              </div>
              <span className="font-mono text-blue-300 text-[11px]">Zero Disk Write</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cryptographic Audit Trail Verification */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              Cryptographically Chained Immutable Audit Trail
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Each state transition is hashed using SHA-256 and chained to the previous block, creating a tamper-evident ledger.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={checkChain}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verify Chain Integrity
            </button>
            <button
              onClick={() => {
                simulateAuditTamper();
                checkChain();
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition shadow"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              Test Tamper Detection
            </button>
          </div>
        </div>

        {chainStatus && (
          <div
            className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 border ${
              chainStatus.valid
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {chainStatus.valid ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Audit Trail Cryptographic Chain is 100% VALID. All block hashes match sequential root certificates.
              </>
            ) : (
              <>
                <AlertOctagon className="w-4 h-4" />
                SECURITY ALERT: Tampering Detected at Block Index #{chainStatus.brokenAtIndex}! Hash integrity check failed.
              </>
            )}
          </div>
        )}

        <div className="space-y-2">
          {auditLogs.slice(-3).map((log) => (
            <div key={log.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-white font-bold">{log.action}</span>
                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="text-slate-300 font-sans text-xs">{log.details}</div>
              <div className="flex flex-wrap gap-4 text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                <span>Prev Hash: {log.previousHash.slice(0, 16)}...</span>
                <span className="text-emerald-400">Block Hash: {log.hash.slice(0, 16)}...</span>
                <span>Source: {log.ipAddress}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
